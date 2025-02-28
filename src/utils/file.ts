import { toast } from "sonner";

export async function sendImageToBackend(file: File, userId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
  
    const imageUrl = await fetch("/api/bucket/upload", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          toast.error(await response.text());
          return;
        }
  
        return (await response.text()).replaceAll('"', "");
      })
      .catch((error) => {
        console.error(error);
      });
    return imageUrl;
  }