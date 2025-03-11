import DemoWrapper from './demo-wrapper';

export default function Demo() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-col flex-1 mx-auto w-full">
        <DemoWrapper />
      </div>
    </main>
  );
}
