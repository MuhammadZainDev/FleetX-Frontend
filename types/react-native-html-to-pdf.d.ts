declare module 'react-native-html-to-pdf' {
  interface RNHTMLtoPDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
  }

  interface RNHTMLtoPDFResult {
    filePath: string;
    base64?: string;
  }

  function convert(options: RNHTMLtoPDFOptions): Promise<RNHTMLtoPDFResult>;

  export default {
    convert
  };
} 