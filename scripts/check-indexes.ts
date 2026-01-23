#!/usr/bin/env ts-node

/**
 * Script para verificar índices no banco de dados
 *
 * Uso: npx ts-node scripts/check-indexes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IndexInfo {
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface TableSize {
  tablename: string;
  total_size: string;
  table_size: string;
  indexes_size: string;
}

async function checkIndexes() {
  console.log('\n=========================================');
  console.log('VERIFICAÇÃO DE ÍNDICES - IM-VESTOR');
  console.log('=========================================\n');

  try {
    // 1. Listar todos os índices
    console.log('📊 TODOS OS ÍNDICES NO BANCO:\n');
    console.log('-----------------------------------------');

    const indexes = await prisma.$queryRaw<IndexInfo[]>`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

    // Agrupar por tabela
    const indexesByTable = indexes.reduce((acc, idx) => {
      if (!acc[idx.tablename]) {
        acc[idx.tablename] = [];
      }
      acc[idx.tablename].push(idx);
      return acc;
    }, {} as Record<string, IndexInfo[]>);

    // Tabelas críticas para verificar
    const criticalTables = [
      'ProjectView',
      'Negotiation',
      'Project',
      'Meeting',
      'Notification',
      'Connection',
      'Referral',
      'User',
      'Investor',
      'Entrepreneur',
    ];

    console.log('Tabelas críticas:\n');

    criticalTables.forEach(table => {
      const tableIndexes = indexesByTable[table] || [];
      console.log(`\n📋 ${table} (${tableIndexes.length} índices):`);

      if (tableIndexes.length === 0) {
        console.log('   ❌ NENHUM ÍNDICE ENCONTRADO!');
      } else {
        tableIndexes.forEach(idx => {
          const isPrimaryKey = idx.indexname.includes('_pkey');
          const isPerformanceIndex = !isPrimaryKey && !idx.indexname.startsWith('_');
          const icon = isPrimaryKey ? '🔑' : isPerformanceIndex ? '⚡' : '🔗';

          console.log(`   ${icon} ${idx.indexname}`);
          if (isPerformanceIndex) {
            // Extrair colunas do indexdef
            const match = idx.indexdef.match(/\((.*?)\)/);
            if (match) {
              console.log(`      Colunas: ${match[1]}`);
            }
          }
        });
      }
    });

    console.log('\n\n📏 TAMANHO DAS TABELAS E ÍNDICES:\n');
    console.log('-----------------------------------------');

    const tableSizes = await prisma.$queryRaw<TableSize[]>`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(quote_ident(tablename)::regclass)) AS total_size,
        pg_size_pretty(pg_relation_size(quote_ident(tablename)::regclass)) AS table_size,
        pg_size_pretty(
          pg_total_relation_size(quote_ident(tablename)::regclass) -
          pg_relation_size(quote_ident(tablename)::regclass)
        ) AS indexes_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(quote_ident(tablename)::regclass) DESC
      LIMIT 15
    `;

    console.log('\nTop 15 tabelas por tamanho:\n');
    tableSizes.forEach((table, idx) => {
      console.log(`${idx + 1}. ${table.tablename}`);
      console.log(`   Total: ${table.total_size} | Tabela: ${table.table_size} | Índices: ${table.indexes_size}`);
    });

    // 3. Verificar índices específicos de performance
    console.log('\n\n🎯 VERIFICAÇÃO DE ÍNDICES DE PERFORMANCE:\n');
    console.log('-----------------------------------------\n');

    const expectedIndexes = [
      { table: 'ProjectView', index: 'ProjectView_projectId_idx', critical: true },
      { table: 'ProjectView', index: 'ProjectView_investorId_idx', critical: true },
      { table: 'ProjectView', index: 'ProjectView_vcGroupId_idx', critical: true },
      { table: 'ProjectView', index: 'ProjectView_createdAt_idx', critical: true },
      { table: 'Negotiation', index: 'Negotiation_investorId_idx', critical: true },
      { table: 'Negotiation', index: 'Negotiation_projectId_idx', critical: true },
      { table: 'Negotiation', index: 'Negotiation_vcGroupId_idx', critical: true },
      { table: 'Negotiation', index: 'Negotiation_stage_idx', critical: true },
      { table: 'Project', index: 'Project_sectorId_idx', critical: true },
      { table: 'Project', index: 'Project_visibility_status_boostedUntil_createdAt_idx', critical: true },
      { table: 'Meeting', index: 'Meeting_entrepreneurId_idx', critical: true },
      { table: 'Meeting', index: 'Meeting_negotiationId_idx', critical: true },
      { table: 'Meeting', index: 'Meeting_startDate_idx', critical: true },
      { table: 'Notification', index: 'Notification_userId_idx', critical: true },
      { table: 'Notification', index: 'Notification_userId_read_idx', critical: true },
      { table: 'Connection', index: 'Connection_followerId_idx', critical: true },
      { table: 'Connection', index: 'Connection_followingId_idx', critical: true },
      { table: 'Referral', index: 'Referral_referrerId_idx', critical: true },
      { table: 'Referral', index: 'Referral_referredId_idx', critical: true },
    ];

    let missingIndexes = 0;
    let foundIndexes = 0;

    expectedIndexes.forEach(expected => {
      const tableIndexes = indexesByTable[expected.table] || [];
      const found = tableIndexes.some(idx => idx.indexname === expected.index);

      if (found) {
        console.log(`✅ ${expected.table}.${expected.index}`);
        foundIndexes++;
      } else {
        console.log(`❌ ${expected.table}.${expected.index} ${expected.critical ? '(CRÍTICO!)' : ''}`);
        missingIndexes++;
      }
    });

    console.log('\n-----------------------------------------');
    console.log(`📊 Resultado: ${foundIndexes}/${expectedIndexes.length} índices encontrados`);

    if (missingIndexes > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${missingIndexes} índices de performance estão faltando!`);
      console.log('\nAção recomendada:');
      console.log('  1. Verificar se as migrations foram aplicadas corretamente');
      console.log('  2. Re-executar: npx prisma migrate deploy');
      console.log('  3. Ou aplicar os índices manualmente via SQL\n');
    } else {
      console.log('\n✅ Todos os índices de performance estão presentes!\n');
    }

    // 4. Estatísticas de uso dos índices
    console.log('\n📈 ESTATÍSTICAS DE USO DOS ÍNDICES:\n');
    console.log('-----------------------------------------');

    interface IndexStats {
      schemaname: string;
      tablename: string;
      indexname: string;
      idx_scan: bigint;
      idx_tup_read: bigint;
      idx_tup_fetch: bigint;
    }

    const indexStats = await prisma.$queryRaw<IndexStats[]>`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20
    `;

    console.log('\nTop 20 índices mais usados:\n');
    indexStats.forEach((stat, idx) => {
      const scans = Number(stat.idx_scan);
      console.log(`${idx + 1}. ${stat.tablename}.${stat.indexname}`);
      console.log(`   Scans: ${scans.toLocaleString()} | Reads: ${Number(stat.idx_tup_read).toLocaleString()}`);
    });

  } catch (error) {
    console.error('\n❌ Erro ao verificar índices:', error);
    if (error instanceof Error) {
      console.error('   Detalhes:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n=========================================');
  console.log('VERIFICAÇÃO CONCLUÍDA');
  console.log('=========================================\n');
}

// Executar
checkIndexes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
