import { extname } from 'path';
import { storage } from 'firebase-config';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import * as path from 'path';
// export const uploadPhotoFirebase = async (file: Express.Multer.File) => {
//   const randomName = Array(32)
//     .fill(null)
//     .map(() => Math.round(Math.random() * 16).toString(16))
//     .join('');
//   const ext = extname(file.originalname);
//   const fileName = `${randomName}${ext}`;
//   const imageRef = ref(storage, `imagenes/${fileName}`);

//   await uploadBytes(imageRef, file.buffer).then((snapshot) => {
//     console.log('Uploaded a blob or file!');
//   });

// const httpsReference = ref(
//   storage,
//   `https://firebasestorage.googleapis.com/v0/b/bucket/o/${fileName}?alt=media`,
// );
//   const imageUrl = await getDownloadURL(imageRef);
//   console.log('File URL:', imageUrl);
//   return imageUrl;
// };

export const uploadPhotoFirebase = async (file: Express.Multer.File) => {
  try {
    // Generate a random filename (consider using a cryptographically secure method)
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    const ext = path.extname(file.originalname).toLowerCase(); // Use path for better filename extraction
    const fileName = `${randomName}${ext}`;

    // Create a reference to the image in Firebase Storage
    // const imageRef = storage.ref().child(`imagenes/${fileName}`);
    const imageRef = ref(storage, `imagenes/${fileName}`);
    // Use bucket instead of ref

    const metadata = {
      contentType: file.mimetype, // Tipo MIME del archivo
      contentDisposition: 'inline', // Muestra el archivo en lugar de descargarlo
    };

    // Upload the image to Firebase Storage
    await uploadBytes(imageRef, file.buffer, metadata).then((snapshot) => {
      console.log('Uploaded a blob or file!');
    });
    console.log('Image uploaded to Firebase Storage:', fileName);

    // Get the downloadable URL for the image (consider security rules)

    const imageUrl = await getDownloadURL(imageRef);

    return imageUrl;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error; // Re-throw the error for proper handling
  }
};

export const uploadPdfFirebase = async (file: Express.Multer.File) => {
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  const ext = extname(file.originalname);
  const fileName = `${randomName}${ext}`;
  const fileRef = ref(storage, `files/${fileName}`);

  await uploadBytes(fileRef, file.buffer).then((snapshot) => {
    console.log('Uploaded a blob or file!');
  });

  const httpsReference = ref(
    storage,
    `https://firebasestorage.googleapis.com/v0/b/bucket/o/${fileName}?alt=media`,
  );
  const fileUrl = await getDownloadURL(fileRef);
  console.log('File URL:', fileUrl);
  return fileUrl;
};

export const deleteImageReference = (imageUrl: string) => {
  const deleteImageRef = ref(
    storage,
    `imagenes/${imageUrl.split('/imagenes%2F').pop().split('?')[0]}`,
  );
  deleteObject(deleteImageRef)
    .then(() => {
      console.log('File delete');
    })
    .catch((error) => {
      console.log(error);
    });
};

export const deletePdfReference = (pdfUrl: string) => {
  const deletePdfRef = ref(
    storage,
    `files/${pdfUrl.split('/files%2F').pop().split('?')[0]}`,
  );
  deleteObject(deletePdfRef)
    .then(() => {
      console.log('PDF deleted successfully');
    })
    .catch((error) => {
      console.log(error);
    });
};
