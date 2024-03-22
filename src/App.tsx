import { useState, ChangeEvent } from "react";
import Tesseract from "tesseract.js";
import { loadImage, createCanvas } from "canvas";
import "./App.css";

const App = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
      setOcrResult(null);
    }
  };

  const processImage = (imagePath: string) => {
    setLoading(true);

    loadImage(imagePath).then((image) => {
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      Tesseract.recognize(imagePath, "eng")
        .then(({ data: { words } }) => {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;

          for (const word of words) {
            const { x0, y0, x1, y1 } = word.bbox;
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
          }

          const extractedText = words.map((word) => word.text).join(" ");
          setExtractedText(extractedText);

          const dataUrl = canvas.toDataURL("image/png");

          const byteString = atob(dataUrl.split(",")[1]);
          const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          const blob = new Blob([ab], { type: mimeString });

          const file = new File([blob], "processed_image.png");

          setOcrResult(file);
          setLoading(false);
        })
        .catch((error) => console.error("Error:", error))
        .finally(() => setLoading(false));
    });
  };

  const handleUpload = () => {
    if (imageFile) {
      if (ocrResult) {
        downloadFile(ocrResult);
      } else {
        const imagePath = URL.createObjectURL(imageFile);
        processImage(imagePath);
      }
    }
  };

  const copyTextToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const downloadFile = (file: File) => {
    const originalName = file.name.split(".")[0];
    const extension = file.name.split(".").pop();
    const newFileName = `${originalName}out.${extension}`;

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", newFileName);
    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen ">
      <main className="h-full">
        <div className="h-full bg-gray-900 pt-10 sm:pt-16 lg:overflow-hidden lg:pb-14 lg:pt-8">
          <div className="mx-auto max-w-7xl lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8">
              <div className="mx-auto max-w-md px-6 sm:max-w-2xl sm:text-center lg:flex lg:items-center lg:px-0 lg:text-left">
                <div className="lg:py-24">
                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:mt-6 xl:text-6xl">
                    <span className="block">Experience the power of</span>
                    <span className="block mt-4 text-indigo-400">
                      Tesseract.js
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                    Effortlessly extract text from images and visualize bounding
                    boxes.
                  </p>
                  <div className="mt-10 sm:mt-12">
                    <form className="sm:mx-auto sm:max-w-xl lg:mx-0">
                      <div className="sm:flex">
                        <div className="min-w-0 flex-1">
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full text-black text-lg bg-gray-100 file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-800 file:hover:bg-gray-700 file:text-white rounded"
                          />
                        </div>
                        <div className="mt-3 sm:ml-3 sm:mt-0">
                          <button
                            type="button"
                            onClick={handleUpload}
                            className="block w-full rounded-md bg-indigo-500 px-4 py-3 font-medium text-white shadow hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-gray-900"
                            disabled={!imageFile || loading}
                          >
                            {loading
                              ? "Processing"
                              : ocrResult
                              ? "Download"
                              : "Upload"}
                          </button>
                        </div>
                      </div>
                      {ocrResult && (
                        <div className="flex flex-col mt-3 sm:ml-3 sm:mt-0 justify-end">
                          <div className="flex justify-end items-center mt-3">
                            <button
                              type="button"
                              className="bg-gray-300 px-2 py-1 rounded-md text-gray-700 mr-2"
                              onClick={copyTextToClipboard}
                            >
                              Copy
                            </button>
                            {copied && (
                              <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-md">
                                Copied!
                              </span>
                            )}
                          </div>

                          <textarea
                            className="w-full h-80 mt-3 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                            value={extractedText}
                            readOnly
                          />
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              <div className="-mb-16 mt-12 sm:-mb-48 lg:relative lg:m-0">
                <div className="mx-auto max-w-md px-6 sm:max-w-2xl lg:max-w-none lg:px-0">
                  {/* Display the processed image */}
                  {ocrResult && (
                    <div>
                      <img
                        className="flex justify-center items-center max-w-4xl"
                        src={URL.createObjectURL(ocrResult)}
                        alt="Processed Image"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More main page content here... */}
      </main>
    </div>
  );
};

export default App;
