import type { AppProps } from "next/app";
import { ToastProvider } from "@/components/common/ToastProvider";
import "@/styles/globals.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
};

export default App;

