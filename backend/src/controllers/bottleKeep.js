// controllers/bottleKeep.js
import { BottleKeep } from "../models/bottleKeep.js";

// Lấy danh sách rượu đang gửi
export const getBottleKeeps = async (req, res) => {
  try {
    const bottles = await BottleKeep.find()
      .sort({ updatedAt: -1 }) // Sắp xếp theo ngày cập nhật mới nhất
      .populate("createdBy", "name")
      .populate("history.performedBy", "name");
    res.status(200).json(bottles);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Thêm rượu gửi mới (Hỗ trợ nhập số thập phân)
// Thêm rượu gửi mới / Mượn mới (Hỗ trợ nhập số thập phân)
export const createBottleKeep = async (req, res) => {
  try {
    const { customerName, bottleName, recordType, expirationDate, qty } = req.body;
    
    // Lấy số lượng thập phân từ Frontend gửi lên, mặc định là 1
    const quantityToAdd = Number(qty) || 1; 

    let existingBottle = await BottleKeep.findOne({
      customerName: { $regex: new RegExp(`^${customerName.trim()}$`, "i") },
      bottleName: bottleName,
      recordType: recordType 
    });

    if (existingBottle) {
      // Nếu đã có -> Cộng dồn số thập phân
      let currentTotal = existingBottle.fullBottles + parseFloat(existingBottle.fraction || "0");
      let newTotal = currentTotal + quantityToAdd;
      
      existingBottle.fullBottles = Math.floor(newTotal);
      existingBottle.fraction = (newTotal % 1).toFixed(1);
      
      // Xử lý chống trôi số thập phân của JS (VD: 1.0 hoặc 0.0)
      if (existingBottle.fraction === "1.0") {
         existingBottle.fullBottles += 1;
         existingBottle.fraction = "0";
      } else if (existingBottle.fraction === "0.0") {
         existingBottle.fraction = "0"; // FIX LỖI ENUM Ở ĐÂY
      }

      if (expirationDate) {
        existingBottle.expirationDate = expirationDate;
      }

      existingBottle.status = recordType === "Gửi" ? "Đang giữ" : "Đang mượn";
      existingBottle.history.push({
        actionType: recordType === "Gửi" ? "Gửi thêm" : "Mượn thêm",
        amountChanged: `+${quantityToAdd} chai`,
        performedBy: req.user.id,
        date: new Date()
      });
      
      await existingBottle.save();
      
      await existingBottle.populate("createdBy", "name");
      await existingBottle.populate("history.performedBy", "name");
      return res.status(200).json(existingBottle);

    } else {
      // Nếu chưa có -> Tạo mới hoàn toàn
      const fullBottles = Math.floor(quantityToAdd);
      let fraction = (quantityToAdd % 1).toFixed(1);
      
      // FIX LỖI ENUM FRACTION Ở ĐÂY
      if (fraction === "1.0") {
        fraction = "0";
      } else if (fraction === "0.0") {
        fraction = "0"; 
      }

      const newBottle = new BottleKeep({
        customerName: customerName.trim(),
        bottleName,
        recordType,            
        expirationDate: expirationDate || null, 
        fullBottles,
        fraction,
        status: recordType === "Gửi" ? "Đang giữ" : "Đang mượn",
        history: [{
          // FIX LỖI ENUM ACTIONTYPE Ở ĐÂY (Dùng chung "Gửi thêm" / "Mượn thêm" cho an toàn với Schema)
          actionType: recordType === "Gửi" ? "Gửi thêm" : "Mượn thêm",
          amountChanged: `+${quantityToAdd} chai`,
          performedBy: req.user.id,
          date: new Date()
        }],
        createdBy: req.user.id
      });

      await newBottle.save();
      
      await newBottle.populate("createdBy", "name");
      await newBottle.populate("history.performedBy", "name");
      return res.status(201).json(newBottle);
    }
  } catch (error) {
    console.error("❌ LỖI LƯU RƯỢU:", error);
    res.status(500).json({ message: "Lỗi khi lưu thông tin", error: error.message });
  }
};
// [1]. Cập nhật lại Text của một dòng lịch sử (Chỉ sửa chữ, không sửa kho)
// Cập nhật dòng lịch sử VÀ sửa lại luôn số tồn kho
export const updateBottleHistory = async (req, res) => {
  try {
    const { bottleId, historyId } = req.params;
    // Nhận thêm newFullBottles và newFraction từ Frontend
    const { actionType, amountChanged, note, newFullBottles, newFraction } = req.body;

    const bottle = await BottleKeep.findById(bottleId);
    if (!bottle) return res.status(404).json({ message: "Không tìm thấy dữ liệu" });

    // 1. Cập nhật lại thông tin dòng lịch sử
    const historyItem = bottle.history.id(historyId);
    if (historyItem) {
      historyItem.actionType = actionType;
      historyItem.amountChanged = amountChanged;
      historyItem.amountTaken = amountChanged; // Backup cho phiên bản cũ
      historyItem.note = note;
    }

    // 2. Cập nhật lại số tồn kho thực tế do user nhập
    bottle.fullBottles = Number(newFullBottles);
    bottle.fraction = newFraction;

    // 3. Tự động kiểm tra trạng thái
    if (bottle.fullBottles === 0 && bottle.fraction === "0") {
      bottle.status = "Đã lấy hết";
    } else {
      if (bottle.status === "Đã lấy hết") {
         bottle.status = bottle.recordType === "Gửi" ? "Đang giữ" : "Đang mượn";
      }
    }

    // 4. Lưu lại database
    await bottle.save();
    
    await bottle.populate("createdBy", "name");
    await bottle.populate("history.performedBy", "name");

    res.status(200).json(bottle);
  } catch (error) {
    console.error("❌ LỖI SỬA LỊCH SỬ:", error);
    res.status(500).json({ message: "Lỗi khi sửa lịch sử", error: error.message });
  }
};
export const deleteBottle = async (req, res) => {
  try {
    const { id } = req.params;
    await BottleKeep.findByIdAndDelete(id);
    res.status(200).json({ message: "Đã xóa toàn bộ phiếu rượu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ khi xóa", error: error.message });
  }
};
// [2]. Xóa lịch sử thao tác và Cập nhật lại kho
export const deleteBottleHistoryAndUpdateStock = async (req, res) => {
  try {
    const { bottleId, historyId } = req.params;
    const { newFullBottles, newFraction } = req.body;

    const bottle = await BottleKeep.findById(bottleId);
    if (!bottle) return res.status(404).json({ message: "Không tìm thấy dữ liệu" });

    // 1. Loại bỏ dòng lịch sử
    bottle.history = bottle.history.filter(h => h._id.toString() !== historyId);

    // 2. Cập nhật lượng kho mới
    bottle.fullBottles = Number(newFullBottles);
    bottle.fraction = newFraction;

    // 3. Tự động chuyển đổi Status
    if (bottle.fullBottles === 0 && bottle.fraction === "0") {
      bottle.status = "Đã lấy hết";
    } else {
      if (bottle.status === "Đã lấy hết") bottle.status = "Đang giữ";
    }

    // 4. Lưu lại
    await bottle.save();
    await bottle.populate("createdBy", "name");
    await bottle.populate("history.performedBy", "name");

    res.status(200).json(bottle);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa và cập nhật kho", error: error.message });
  }
};
// Rót rượu / Cập nhật lịch sử xuất
export const withdrawBottle = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountTaken, newFullBottles, newFraction, note } = req.body;

    const bottle = await BottleKeep.findById(id);
    if (!bottle) return res.status(404).json({ message: "Không tìm thấy dữ liệu" });

    // Cập nhật tồn mới
    bottle.fullBottles = Number(newFullBottles);
    bottle.fraction = newFraction;
    
    // Kiểm tra xem đã hết sạch chưa
    if (bottle.fullBottles === 0 && bottle.fraction === "0") {
      bottle.status = "Đã lấy hết";
    } else {
      bottle.status = "Đang giữ";
    }

    // Lưu lịch sử
    bottle.history.push({
      actionType: "Rót rượu",
      amountChanged: amountTaken,
      note,
      performedBy: req.user.id,
      date: new Date()
    });

    await bottle.save();
    
    await bottle.populate("createdBy", "name");
    await bottle.populate("history.performedBy", "name");
    res.status(200).json(bottle);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xuất rượu", error: error.message });
  }
};