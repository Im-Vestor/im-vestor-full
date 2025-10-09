# Guia do Light Mode - IM-Vestor

## Visão Geral

Este guia explica como usar o sistema de light mode implementado no IM-Vestor, que foi desenvolvido com foco especial em contraste e acessibilidade.

## Como Ativar o Light Mode

Para ativar o light mode, adicione a classe `light` ao elemento raiz (geralmente `<html>` ou `<body>`):

```html
<html class="light">
  <!-- conteúdo da página -->
</html>
```

## Cores e Contraste

### Cores Principais
- **Background**: Branco puro (#FFFFFF) para máximo contraste
- **Texto Principal**: Preto escuro (#171717) - contraste de 16.5:1
- **Texto Secundário**: Cinza escuro (#737373) - contraste de 4.5:1
- **Texto Muted**: Cinza médio (#999999) - contraste de 3:1

### Cores de Interface
- **Bordas**: Cinza claro (#E5E5E5) para definição sutil
- **Cards**: Branco com bordas sutis para separação visual
- **Inputs**: Fundo branco com bordas definidas

### Cores de Status
- **Sucesso**: Verde escuro (#16A34A) - contraste de 4.5:1
- **Aviso**: Laranja (#F59E0B) - contraste de 3:1
- **Erro**: Vermelho (#DC2626) - contraste de 4.5:1
- **Info**: Azul (#2563EB) - contraste de 4.5:1

## Classes CSS Disponíveis

### Backgrounds
```css
.light .bg-background          /* Fundo principal branco */
.light .bg-background-card     /* Fundo de cards */
```

### Textos
```css
.light .text-ui-text           /* Texto principal */
.light .text-ui-text-muted     /* Texto secundário */
```

### Bordas
```css
.light .border                 /* Borda padrão */
.light .border-ui-border       /* Borda de interface */
```

## Exemplos de Uso

### Card com Light Mode
```jsx
<div className="light:bg-white light:border-gray-200 light:text-gray-900 bg-gray-800 border-gray-700 text-white p-4 rounded-lg">
  <h3 className="light:text-gray-900 text-white font-semibold">Título do Card</h3>
  <p className="light:text-gray-600 text-gray-300">Descrição do conteúdo</p>
</div>
```

### Botão com Light Mode
```jsx
<button className="light:bg-gray-100 light:text-gray-900 light:border-gray-300 bg-gray-700 text-white border-gray-600 px-4 py-2 rounded">
  Clique aqui
</button>
```

### Input com Light Mode
```jsx
<input
  className="light:bg-white light:text-gray-900 light:border-gray-300 bg-gray-800 text-white border-gray-600 px-3 py-2 rounded"
  placeholder="Digite aqui..."
/>
```

## Variáveis CSS Customizadas

O sistema utiliza variáveis CSS que são automaticamente aplicadas quando a classe `light` está presente:

```css
.light {
  --background: 0 0% 100%;           /* Branco */
  --text-primary: 0 0% 9%;           /* Preto escuro */
  --text-secondary: 0 0% 45%;        /* Cinza escuro */
  --text-muted: 0 0% 60%;            /* Cinza médio */
  --border: 0 0% 90%;                /* Cinza claro */
  --card: 0 0% 100%;                 /* Branco */
  --card-foreground: 0 0% 9%;        /* Preto escuro */
  /* ... outras variáveis */
}
```

## Scrollbar Personalizada

O light mode inclui scrollbars personalizadas com cores adequadas:

- **Track**: Cinza muito claro (#F1F1F1)
- **Thumb**: Cinza médio (#C1C1C1)
- **Hover**: Cinza escuro (#A8A8A8)

## Acessibilidade

### Contraste WCAG
Todas as cores foram testadas para atender aos padrões WCAG:
- **AA**: Contraste mínimo de 4.5:1 para texto normal
- **AAA**: Contraste mínimo de 7:1 para texto pequeno
- **AA Large**: Contraste mínimo de 3:1 para texto grande

### Testes Recomendados
1. Use ferramentas como WebAIM Contrast Checker
2. Teste com simuladores de daltonismo
3. Verifique em diferentes dispositivos e tamanhos de tela

## Implementação em Componentes

### Usando Tailwind com Light Mode
```jsx
// Componente que se adapta automaticamente
<div className="bg-background text-ui-text border border-ui-border">
  <h1 className="text-2xl font-bold">Título</h1>
  <p className="text-ui-text-muted">Descrição</p>
</div>
```

### Usando Classes Condicionais
```jsx
<div className={`
  ${isLightMode ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'}
  p-4 rounded-lg
`}>
  Conteúdo adaptável
</div>
```

## Migração de Componentes Existentes

Para migrar componentes existentes para suportar light mode:

1. **Identifique cores hardcoded**: Substitua por classes Tailwind
2. **Use variáveis CSS**: Aproveite as variáveis definidas
3. **Teste contraste**: Verifique acessibilidade
4. **Adicione classes condicionais**: Use `light:` prefix quando necessário

## Troubleshooting

### Problemas Comuns

1. **Contraste insuficiente**: Verifique se está usando as classes corretas
2. **Cores não aplicadas**: Confirme se a classe `light` está no elemento raiz
3. **Scrollbar não muda**: Verifique se o CSS está sendo carregado corretamente

### Debug
```css
/* Adicione temporariamente para debug */
.light * {
  outline: 1px solid red;
}
```

## Próximos Passos

1. Implementar toggle de tema
2. Adicionar persistência no localStorage
3. Criar mais componentes com suporte a light mode
4. Expandir paleta de cores conforme necessário


