import { uploadFileToOSS } from '../../services/ossUpload.js';

export function useSiteConfigUploadActions({ setUploadState, setSiteConfigDraft, saveConfigToServer }) {
  const handleUploadLogo = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      logo: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'images/logo',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            logo: { status: 'uploading', progress },
          }));
        },
      });

      setSiteConfigDraft((prev) => ({ ...prev, logoImageUrl: result.url }));
      // TODO: saveConfigToServer implementation missing in history, injected via params.
      await saveConfigToServer({
        logoImageUrl: result.url,
      });
      setUploadState((prev) => ({
        ...prev,
        logo: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        logo: { status: 'error', progress: 0 },
      }));
    }
  };

  const handleUploadQrCode = async (file) => {
    setUploadState((prev) => ({
      ...prev,
      qrCode: { status: 'uploading', progress: 0 },
    }));

    try {
      const result = await uploadFileToOSS({
        file,
        dir: 'images/wechat-qr',
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            qrCode: { status: 'uploading', progress },
          }));
        },
      });

      setSiteConfigDraft((prev) => ({ ...prev, qrCodeImageUrl: result.url }));
      // TODO: saveConfigToServer implementation missing in history, injected via params.
      await saveConfigToServer({
        qrCodeImageUrl: result.url,
      });
      setUploadState((prev) => ({
        ...prev,
        qrCode: { status: 'success', progress: 100 },
      }));
    } catch (error) {
      console.error(error);
      setUploadState((prev) => ({
        ...prev,
        qrCode: { status: 'error', progress: 0 },
      }));
    }
  };

  return {
    handleUploadLogo,
    handleUploadQrCode,
  };
}
