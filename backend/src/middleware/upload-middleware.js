// middlewares/upload.js (hoặc file bạn vừa gửi)
import multer from "multer";

const storage = multer.memoryStorage();

// Sửa lại filter để nhận cả ảnh và tài liệu
const fileFilter = (req, file, cb) => {
  // Cho phép ảnh
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  
  // Cho phép các loại file tài liệu phổ biến (PDF, Word, Excel, Text)
  const allowedDocTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain"
  ];

  if (allowedDocTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error("Định dạng file không được hỗ trợ (Chỉ nhận ảnh, PDF, Word, Excel)"));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Nên tăng lên 10MB vì file PDF/Word có thể nặng hơn ảnh
  },
  fileFilter: fileFilter,
});

export default upload;