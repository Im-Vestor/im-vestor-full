import Head from 'next/head';

export default function PartnersDeal() {
  return (
    <>
      <Head>
        <title>Proposta de Parceria — im-vestor.com</title>
      </Head>
      <iframe
        src="/partners-deal.html"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
        title="Proposta de Parceria im-vestor"
      />
    </>
  );
}
