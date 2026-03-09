import Head from 'next/head';

export default function CountDown() {
  return (
    <>
      <Head>
        <title>im-vestor.com — Countdown</title>
      </Head>
      <iframe
        src="/countdown.html"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
        title="im-vestor countdown"
      />
    </>
  );
}
