import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Search, Calendar, RefreshCcw, FileWarning, Trash2, CheckSquare, Minus, Plus, Edit3, XCircle, FileText, ClipboardList, PlusCircle, ArrowUpDown, Receipt } from "lucide-react";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";

// ==========================================
// DATA MÓN TĨNH (TỪ EXCEL)
// ==========================================
// Bạn paste lại danh sách 300+ món của bạn vào đây
const initialCancelData: any[] = [
  { category: "Món ăn", name: "Cua Lột Chiên Tempura", price: 219000 },
  { category: "Món ăn", name: "Tôm, Cá Trắng, Mực, Rau & Nấm Chiên Tempura, Xốt Tương Nấm Trufle", price: 349000 },
  { category: "Món ăn", name: "Gà Chiên Kiểu Nhật", price: 149000 },
  { category: "Món ăn", name: "Râu Mực Chiên Giòn (Ikagesho Karaage)", price: 149000 },
  { category: "Món ăn", name: "Sò Điệp Xào, Xốt Cay X.O Nhật", price: 249000 },
  { category: "Món ăn", name: "Mề Vịt Xào Giá Hẹ", price: 179000 },
  { category: "Món ăn", name: "Tôm Chiên Giòn/Koebi Karaage", price: 99000 },
  { category: "Món ăn", name: "Lòng bò Chiên Xốt Ponzu/Deep-Fried  Intestines, Ponzu Sauce", price: 149000 },
  { category: "Món ăn", name: "Khoai Tây Chiên/French Fries", price: 79000 },
  { category: "Món ăn", name: "Tôm Tempura/Prawn Tempura", price: 279000 },
  { category: "Món ăn", name: "Hàu Chiên với 2 Loại Xốt: Mayo / Tonkatsu", price: 199000 },
  { category: "Món ăn", name: "Blue Fin Fatty Tuna/ Bụng Cá Ngừ Sushi", price: 449000 },
  { category: "Món ăn", name: "Hạt Roasted Edamame - Britcharm", price: 39682 },
  { category: "Món ăn", name: "Hạt Ginkgo Nuts - Britcharm", price: 47619 },
  { category: "Món ăn", name: "Món Grilled Stingray Fins - Britcharm", price: 119929 },
  { category: "Món ăn", name: "Món Crispy chiken cartilage - Britcharm", price: 88183 },
  { category: "Món ăn", name: "Món Cajun Fried Chiken & Fries - Britcharm", price: 160494 },
  { category: "Món ăn", name: "Món Crispy Anchovies - Britcharm", price: 47619 },
  { category: "Món ăn", name: "Món French Fries - Britcharm", price: 69665 },
  { category: "Món ăn", name: "Món Assorted Grilled 5 Skewers- Britcharm", price: 264550 },
  { category: "Món ăn", name: "Món Assorted Grilled 7 Skewers- Britcharm", price: 313051 },
  { category: "Món ăn", name: "Bạch Tuộc/ Octopus Sashimi", price: 179000 },
  { category: "Món ăn", name: "CB8_SET 1: SASHIMI ĐB + SALAD RONG BIỂN", price: 2000000 },
  { category: "Món ăn", name: "CB8_SET 2: SUSHI ĐB + SALAD TÔM", price: 2000000 },
  { category: "Món ăn", name: "CB8_SET 3: XIÊN 7 + XIÊN RAU CỦ + SALAD CÀNG CUA", price: 1250000 },
  { category: "Món ăn", name: "CB8_SET 4: MÌ RAMEN + CUA LỘT + RAU CỦ TEM", price: 1250000 },
  { category: "Món ăn", name: "CB8_SET 5: TOMAHAWK + SALAD RONG BIỂN", price: 3850000 },
  { category: "Món ăn", name: "Cá Tráp Đỏ Sushi", price: 149000 },
  { category: "Món ăn", name: "FG. Steamed Egg/Trứng hấp hải sản", price: 98000 },
  { category: "Món ăn", name: "FG. Seafood salad/Salad hải sản", price: 250000 },
  { category: "Món ăn", name: "FG. MÌ RAMEN ( 1VAT)", price: 50000 },
  { category: "Món ăn", name: "FG. NƯỚC LẨU THÊM", price: 50000 },
  { category: "Món ăn", name: "FG. RONG NHO THÊM", price: 70000 },
  { category: "Món ăn", name: "FG. TÍA TÔ THÊM", price: 50000 },
  { category: "Món ăn", name: "FG. RONG BIỂN THÊM", price: 70000 },
  { category: "Món ăn", name: "FG. Dưa leo", price: 90000 },
  { category: "Món ăn", name: "FG. Xà Lách Tôm Áp Chảo", price: 220000 },
  { category: "Món ăn", name: "FG. Bacon salad with poached egg/Salad thịt xông khối trứng lòng đào", price: 220000 },
  { category: "Món ăn", name: "FG. Vegetable salad/Salad rau củ", price: 120000 },
  { category: "Món ăn", name: "FG. Crab claw salad/Salad càng cua", price: 220000 },
  { category: "Món ăn", name: "FG. Ocean garden roll/Cuộn cá ngừ và cá hồi cao cấp", price: 686000 },
  { category: "Món ăn", name: "FG. Tuna tartare trio/Sushi áp chảo cá ngừ tartare", price: 675000 },
  { category: "Món ăn", name: "FG. Kuro maguro symphony set/Sườn cá ngừ vây xanh thượng hạng", price: 3490000 },
  { category: "Món ăn", name: "FG. Shrimp with Thai sauce/Tôm sú biển sốt thái", price: 230000 },
  { category: "Món ăn", name: "FG. Yellowtail cappachio/Cá cam cappachio", price: 290000 },
  { category: "Món ăn", name: "FG. Premium beluga served with toast/Trứng cá tầm Beluga thượng hạng với bánh mì nướng", price: 6700000 },
  { category: "Món ăn", name: "FG. Mochi 3 viên", price: 149000 },
  { category: "Món ăn", name: "FG. Mochi 1 viên", price: 59000 },
  { category: "Món ăn", name: "FG.Đậu nành nhật/Japanese Soybeans", price: 59000 },
  { category: "Món ăn", name: "FG. Janpanese Scallops caviar with pasamic sauce/Sò điệp Nhật với sốt pasamic và caviar", price: 350000 },
  { category: "Món ăn", name: "FG. Salmon caviar with paro sauce/Cá hồi sốt paro và caviar", price: 750000 },
  { category: "Món ăn", name: "FG. FUGU Seafood Platter/Đảo hải sản cao cấp FUGU", price: 2499000 },
  { category: "Món ăn", name: "FG. Yellowtail with jalapeno peppers/Cá cam ăn kèm ớt jalapeno", price: 420000 },
  { category: "Món ăn", name: "FG. Tuna Tatare/Cá ngừ tatare", price: 620000 },
  { category: "Món ăn", name: "FG. Sashimi Fugu/Sashimi cá nóc", price: 599000 },
  { category: "Món ăn", name: "FG. Sashimi Salmon belly/Sashimi Bụng cá hồi", price: 250000 },
  { category: "Món ăn", name: "FG. Sashimi Sea Urchin/Sashimi cầu gai", price: 690000 },
  { category: "Món ăn", name: "FG. Sashimi Salmon/Sashimi cá hồi", price: 220000 },
  { category: "Món ăn", name: "FG. Sashimi Hokkigai/Sashimi sò đỏ", price: 130000 },
  { category: "Món ăn", name: "FG. Sashimi Canada Oysters/Sashimi Hàu canada", price: 420000 },
  { category: "Món ăn", name: "FG. Sashimi Japanese Scallops/Sashimi sò điệp Nhật", price: 230000 },
  { category: "Món ăn", name: "FG. Sashimi Bluefin Tuna/Cá ngừ vây xanh(chutoro)", price: 520000 },
  { category: "Món ăn", name: "FG. Sashimi Yellowtail/Sashimi Cá cam", price: 240000 },
  { category: "Món ăn", name: "FG. Sashimi Amaebi/Sashimi tôm ngọt", price: 380000 },
  { category: "Món ăn", name: "FG. Mixed 3 kinds sashimi/Sashimi 3 loại tổng hợp", price: 390000 },
  { category: "Món ăn", name: "FG. Mixed 5 kinds sashimi/Sashimi 5 loại tổng hợp", price: 790000 },
  { category: "Món ăn", name: "FG. Mixed 7 kinds sashimi/Sashimi 7 loại tổng hợp", price: 1290000 },
  { category: "Món ăn", name: "FG. FUGU's special sashimi/Sashimi FUGU đặc biêt", price: 1800000 },
  { category: "Món ăn", name: "FG. Mixed 3 kinds sushi/Sushi 3 loại tổng hợp", price: 249000 },
  { category: "Món ăn", name: "FG. Salt-Roasted Ginkgo Nuts/Bạch quả rang muối", price: 59000 },
  { category: "Món ăn", name: "FG. Mixed 5 kinds sushi/Sushi 5 loại tổng hợp", price: 525000 },
  { category: "Món ăn", name: "FG. Mixed 7 kinds sushi/Sushi 7 loại tổng hợp", price: 950000 },
  { category: "Món ăn", name: "FG. FUGU'S Special sushi/Sushi tổng hợp FUGU đặc biệt", price: 1700000 },
  { category: "Món ăn", name: "FG. Wagyu cappachio/Bò wagyu cappachio", price: 589000 },
  { category: "Món ăn", name: "FG. Wagyu katsu sando/Sandwich bò wagyu và caviar", price: 550000 },
  { category: "Món ăn", name: "FG. Premium tomahawl streak/Sườn bò tomahawl thượng hạng", price: 3850000 },
  { category: "Món ăn", name: "FG. Grilled lamb chops/Sườn cừu nướng", price: 360000 },
  { category: "Món ăn", name: "FG. Japanese wagyu vegetable rolls with teriyaki sauce/Bò wagyu nhật cuộn rau củ với sốt teriyaki", price: 260000 },
  { category: "Món ăn", name: "FG. Grilled Japanese wagyu with BBQ sauce/Bò wagyu nhật áp chảo sốt BBQ", price: 850000 },
  { category: "Món ăn", name: "FG. Grilled beef with enoki mushroom/Bò cuộn nấm kim châm nướng", price: 159000 },
  { category: "Món ăn", name: "FG. Deep Fried Anchovy/Cá cơm chiên giòn", price: 59000 },
  { category: "Món ăn", name: "FG. Grilled beef with teriyaki sauce/Bò waygu nướng sốt Teriyaki", price: 159000 },
  { category: "Món ăn", name: "FG. Japanese wagyu beef grilled with Hoba leaves/Bò Wagyu nhật nướng lá Hoba", price: 480000 },
  { category: "Món ăn", name: "FG. Japanese wagyu beef burger served with salad/Burger bò wagyu nhật và salad", price: 520000 },
  { category: "Món ăn", name: "FG. Combo 5 kinds skewers/Xiên tổng hợp 5 loại", price: 330000 },
  { category: "Món ăn", name: "FG. Combo 7 kinds skewers/Xiên tổng hợp 7 loại", price: 390000 },
  { category: "Món ăn", name: "FG. Combo 9 kinds skewers/Xiên tổng hợp 9 loại", price: 490000 },
  { category: "Món ăn", name: "FG. Combo vegetable skewers/Xiên rau củ thập cẩm", price: 110000 },
  { category: "Món ăn", name: "FG. Grilled ayu fish with salt/Cá Ayu nướng muối", price: 250000 },
  { category: "Món ăn", name: "FG. Grilled salmon head with salt/Đầu cá hồi nướng muối", price: 230000 },
  { category: "Món ăn", name: "FG. Grilled saury with salt/Cá thu đao nướng muối", price: 120000 },
  { category: "Món ăn", name: "FG. Assorted Steamed Vegetables/Rau củ hấp", price: 85000 },
  { category: "Món ăn", name: "FG. Grilled black cod with Marinated sauce/Cá tuyết đen nướng với sốt Marinated", price: 320000 },
  { category: "Món ăn", name: "FG. Grilled crab shell with cheese/Mai cua nướng phô mai", price: 320000 },
  { category: "Món ăn", name: "FG. Grilled salmon with mushroom sauce/Cá hồi nướng với sốt kem nấm", price: 640000 },
  { category: "Món ăn", name: "FG. Grilled salmon breast with salt/Lườn cá hồi nướng muối", price: 320000 },
  { category: "Món ăn", name: "FG. Grilled oysters with cheese/Hàu nướng phô mai", price: 430000 },
  { category: "Món ăn", name: "FG. Grilled scallops with cheese/Sò điệp nướng phô mai", price: 190000 },
  { category: "Món ăn", name: "FG. Grilled oysters with chilli miso sauce/Hàu nướng sốt miso ớt hiểm", price: 430000 },
  { category: "Món ăn", name: "FG. Seafood tempura/Tempura hải sản", price: 250000 },
  { category: "Món ăn", name: "FG. Ebi tempura/Tempura tôm sú biển", price: 240000 },
  { category: "Món ăn", name: "FG. Japanese- style frieds dumplings/Bánh xếp chiên kiểu nhật", price: 110000 },
  { category: "Món ăn", name: "FG. French fried with creamy mushroom sauce/Khoai tây chiên và sốt kem nấm", price: 130000 },
  { category: "Món ăn", name: "FG. Fried soft-shell crab/Cua lột chiên giòn", price: 420000 },
  { category: "Món ăn", name: "FG. Cajun frieds chitken/Gà chiên cajun & khoai tây", price: 200000 },
  { category: "Món ăn", name: "FG. Fried vegetables/Tempura rau củ thập cẩm", price: 109000 },
  { category: "Món ăn", name: "FG. Fried chicken cartilage/Sụn gà chiên giòn", price: 110000 },
  { category: "Món ăn", name: "FG. Fried shrimp balls with spicy miso sauce/Tôm viên chiên với sốt miso cay", price: 190000 },
  { category: "Món ăn", name: "FG. Braised pork belly/Cơm thịt kho kiểu nhật", price: 450000 },
  { category: "Món ăn", name: "FG. Stone bowl wagyu beef rice/Cơm bò wagyu nhật ( thố đá )", price: 840000 },
  { category: "Món ăn", name: "FG. Iberico pork fried rice/Cơm chiên thịt heo Iberico", price: 250000 },
  { category: "Món ăn", name: "FG. Japanese eel rice/Cơm lươn nhật", price: 280000 },
  { category: "Món ăn", name: "FG. Japanese eel pan-fried rice/Cơm chiên lươn áp chảo kiểu nhật", price: 310000 },
  { category: "Món ăn", name: "FG. Croissant with creamy crab/Bánh sừng bò sốt kem cua", price: 680000 },
  { category: "Món ăn", name: "FG. Minced wagyu congee/Cháo thịt bò wagyu bầm", price: 360000 },
  { category: "Món ăn", name: "FG. Oysters Congee/Cháo hàu nhật", price: 159000 },
  { category: "Món ăn", name: "FG. Clear soup ramen noodle/Mì ramen súp nước trong", price: 179000 },
  { category: "Món ăn", name: "FG. Char xiu ramen/Mì ramen xá xíu", price: 179000 },
  { category: "Món ăn", name: "FG. Tomyum seafood soup/Súp hải sản tomyum", price: 450000 },
  { category: "Món ăn", name: "FG. Miso soup/Súp miso", price: 59000 },
  { category: "Món ăn", name: "FG. Mushroom clams soup/Súp nghêu hấp nấm", price: 110000 },
  { category: "Món ăn", name: "FG. Seafood hot-pot/Lẩu hải sản", price: 690000 },
  { category: "Món ăn", name: "FG. Sukiyako hot-pot/Lẩu sukiyaki", price: 890000 },
  { category: "Món ăn", name: "FG. Oden hot-pot/Lẩu Oden", price: 360000 },
  { category: "Món ăn", name: "FG. Grilled Stingray fins/Vây cá đuối nướng", price: 150000 },
  { category: "Món ăn", name: "FG. FUGU hot-pot/Lẩu cá nóc", price: 1599000 },
  { category: "Món ăn", name: "FG. FUGU's special combo/Combo cá nóc đặc biệt", price: 4490000 },
  { category: "Món ăn", name: "FG. Ice-cream/Kem tự chọn", price: 100000 },
  { category: "Món ăn", name: "FG. Small plater - season of fruits/Trái cây theo mùa nhỏ", price: 400000 },
  { category: "Món ăn", name: "FG. Big plater - season of fruits/Trái cây theo mùa lớn", price: 600000 },
  { category: "Món ăn", name: "FG. Grilled scallops with cheese/Sò điệp nướng phô mai (5con)", price: 317000 },
  { category: "Món ăn", name: "FG. Grilled oysters with chilli miso sauce/(5CON)Hàu nướng sốt miso ớt hiểm", price: 860000 },
  { category: "Món ăn", name: "FG. FUGU Seafood Platter/Đảo hải sản cao cấp FUGU(6 vẹm, 6 hàu, 6 tôm sú)", price: 3874000 },
  { category: "Món ăn", name: "FG. Trứng gà", price: 30000 },
  { category: "Món ăn", name: "FG. RAU THÊM", price: 100000 },
  { category: "Món ăn", name: "FG. Sườn cừu Úc với sốt cà ri Nhật", price: 385000 },
  { category: "Món ăn", name: "FG. Xà Lách Bò Áp Chảo", price: 180000 },
  { category: "Món ăn", name: "FG. Bánh Mì Nướng", price: 72000 },
  { category: "Món ăn", name: "FG. Hàu Nướng Mỡ Hành (con)", price: 160000 },
  { category: "Món ăn", name: "Salad Hải Sản sốt Saikyo Miso", price: 349000 },
  { category: "Món ăn", name: "Salad Trái Cây Tươi, Xốt Hành Tây", price: 249000 },
  { category: "Món ăn", name: "Salad Cua Lột Tempura, Xốt Mè Rang", price: 279000 },
  { category: "Món ăn", name: "Salad Bò Cháy Cạnh", price: 249000 },
  { category: "Món ăn", name: "Bụng Cá Ngừ Cháy Cạnh, Xốt Yuzu Cay", price: 679000 },
  { category: "Món ăn", name: "Cá Hồi Cháy Cạnh, Xốt Saikyo Miso", price: 249000 },
  { category: "Món ăn", name: "Cá Cam Chỉ Vàng, Xốt Carpaccio", price: 299000 },
  { category: "Món ăn", name: "Tôm Ngọt, Xốt Chanh Dây", price: 349000 },
  { category: "Món ăn", name: "Hàu Cháy Cạnh, Nấm Truffle, Xốt Chanh Dây Cay", price: 179000 },
  { category: "Món ăn", name: "Hàu Sống, Xốt Ponzu Nhật", price: 179000 },
  { category: "Món ăn", name: "Thăn Cá Ngừ Sashimi", price: 499000 },
  { category: "Món ăn", name: "Lườn Cá Ngừ Sashimi", price: 579000 },
  { category: "Món ăn", name: "Blue Fin Fatty Tuna Bụng Cá Ngừ Sashimi", price: 679000 },
  { category: "Món ăn", name: "Trứng Cầu Gai Sashimi", price: 1279000 },
  { category: "Món ăn", name: "Sò Điệp/Scallop Sashimi", price: 249000 },
  { category: "Món ăn", name: "Cá Cam Chỉ Vàng/ Kanpachi Sashimi", price: 219000 },
  { category: "Món ăn", name: "Tôm Ngọt/ Sweet Shrimp Sashimi", price: 299000 },
  { category: "Món ăn", name: "Cá Tráp Đỏ", price: 249000 },
  { category: "Món ăn", name: "Cá Hồi/Salmon Sashimi", price: 149000 },
  { category: "Món ăn", name: "Bụng Cá Hồi/Salmon Belly Sashimi", price: 199000 },
  { category: "Món ăn", name: "Trứng Cá Hồi/ Salmon Roe Sashimi", price: 299000 },
  { category: "Món ăn", name: "Cơm Cuộn Bò Wagyu A5, Măng Tây , Xốt Yakiniku", price: 479000 },
  { category: "Món ăn", name: "Cơm Cuộn Lươn Nhật Nướng, ,Phô Mai", price: 349000 },
  { category: "Món ăn", name: "Cơm Cuộn Cá Hồi, Phô Mai, Xoài, Bơ Trái", price: 279000 },
  { category: "Món ăn", name: "Cơm Cuộn Cua Lột Chiên Tempura, Dưa Leo, Trứng Cá Chuồn", price: 279000 },
  { category: "Món ăn", name: "Sushi & Sashimi Tổng Hợp", price: 1349000 },
  { category: "Món ăn", name: "FG. Grilled Yellowtail Collar/Mang cá cam nướng", price: 230000 },
  { category: "Món ăn", name: "Cá Tuyết Áp Chảo, Xốt Bơ Tỏi Nấm Trufle", price: 679000 },
  { category: "Món ăn", name: "Sò Điệp & Gan Ngỗng Áp Chảo, Xốt Kem Miso", price: 219000 },
  { category: "Món ăn", name: "Cá Tráp Đỏ Nhật Áp Chảo, Xốt Bơ Tỏi Nấm Trufle", price: 449000 },
  { category: "Món ăn", name: "Trứng Hấp Lươn, Trứng Cá Hồi", price: 219000 },
  { category: "Món ăn", name: "Trứng Hấp Ghẹ Xanh Với Trứng Cá Hồi", price: 249000 },
  { category: "Món ăn", name: "Cơm Chiên Hải Sản, Trứng Cá Tuyết", price: 249000 },
  { category: "Món ăn", name: "Mì Nước Udon Hải Sản, Súp  Cay", price: 279000 },
  { category: "Món ăn", name: "Mì Nước Ramen, Ức Vịt Nướng ,Truffle", price: 219000 },
  { category: "Món ăn", name: "Súp Hải Sản, Nấm, Rau Củ", price: 179000 },
  { category: "Món ăn", name: "Súp Rong Biển Đậu Hũ", price: 59000 },
  { category: "Món ăn", name: "Kem Trà Xanh", price: 119000 },
  { category: "Món ăn", name: "Kem Chanh Yuzu", price: 119000 },
  { category: "Món ăn", name: "Kem Hoa Anh Đào Nhật", price: 119000 },
  { category: "Món ăn", name: "Bánh Kem Mochi", price: 99000 },
  { category: "Món ăn", name: "Trái Cây Theo Mùa", price: 349000 },
  { category: "Món ăn", name: "Cá Cam Chỉ Vàng/ Great Amberjack Sushi", price: 179000 },
  { category: "Món ăn", name: "03 Lựa Chọn by Chef/Three Kinds of Assorted Sashimi Chef Choice", price: 579000 },
  { category: "Món ăn", name: "05 Lựa Chọn by Chef/Five  Kinds of Assorted Sashimi Chef Choice", price: 1279000 },
  { category: "Món ăn", name: "07 Lựa Chọn by Chef/ Seven Kinds of Assorted Sashimi Chef Choice", price: 2249000 },
  { category: "Món ăn", name: "Cá Hồi/Salmon Sushi", price: 119000 },
  { category: "Món ăn", name: "Bụng Cá Hồi/ Salmon Belly Sushi", price: 149000 },
  { category: "Món ăn", name: "Trứng Cá Hồi/ Salmon Roe Sushi", price: 249000 },
  { category: "Món ăn", name: "SÒ ĐỎ/ Surf Clam Sashimi", price: 179000 },
  { category: "Món ăn", name: "FG. Kimchi/Kim chi", price: 49000 },
  { category: "Món ăn", name: "CB_SET HALLOWEEN 2025", price: 1200000 },
  { category: "Món ăn", name: "FG. Set Lunch/ Set Ăn Trưa VIP", price: 400000 },
  { category: "Món ăn", name: "FG. Set Lunch/ Set Ăn Trưa VIP Chay", price: 300000 },
  { category: "Món ăn", name: "FG. Flower 1/ Hoa ngọt", price: 650000 },
  { category: "Món ăn", name: "FG. Flower 2/ Hoa ngọt", price: 3000000 },
  { category: "Món ăn", name: "FG. Flower 3/ Hoa yêu thương", price: 950000 },
  { category: "Món ăn", name: "SET MENU ĐẶC BIỆT", price: 1500000 },
  { category: "Món ăn", name: "SET MENU ĐẶC BIỆT-KID", price: 500000 },
  { category: "Món ăn", name: "Món canape 2H", price: 950000 },
  { category: "Món ăn", name: "Gói Phụ Phí", price: 5000000 },
  { category: "Món ăn", name: "FUGU. SET LUNCH( ĐẶC BIỆT)", price: 1000000 },
  { category: "Món ăn", name: "SET MENU ĐẶC BIỆT 3000++", price: 3000000 },
  { category: "Món ăn", name: "FuGu. Set Menu 6", price: 530000 },
  { category: "Món ăn", name: "Sò lông nướng mỡ hành", price: 370000 },
  { category: "Món ăn", name: "SALMON Roe Sashimi / TRỨNG CÁ HỒI", price: 289000 },
  { category: "Món ăn", name: "Grilled Shiitake / Nấm đông cô nướng", price: 49000 },
  { category: "Món ăn", name: "Fried Seaweed / Rong biển chiên giòn", price: 59000 },
  { category: "Món ăn", name: "Grilled  sweet potato / Khoai lang nướng", price: 49000 },
  { category: "Món ăn", name: "Grilled corn / Bắp nướng muối", price: 49000 },
  { category: "Món ăn", name: "Assorted grilled vegetable skewers / Rau củ nướng thập cẩm", price: 109000 },
  { category: "Món ăn", name: "Grilled lamb chops / Sườn cừu nướng", price: 249000 },
  { category: "Món ăn", name: "Grilled Salted Ayu Fish / Cá Ayu nướng muối", price: 249000 },
  { category: "Món ăn", name: "Grilled Salted Hokke Fish / Cá Hokke nướng muối", price: 229000 },
  { category: "Món ăn", name: "Grilled Salted Salmon Head / Đầu cá hồi nướng muối", price: 149000 },
  { category: "Món ăn", name: "Grilled Mackerel With Teriyaki Sauce / Cá Saba Nhật nướng sốt Teriyaki", price: 149000 },
  { category: "Món ăn", name: "Grilled black cod with Marinated sauce / Cá tuyết đen nướng với sốt Marinated", price: 279000 },
  { category: "Món ăn", name: "Grilled Kisu with salt / Cá bống đục nướng", price: 149000 },
  { category: "Món ăn", name: "Deep fried baby shimp / Tép đồng chiên giòn", price: 79000 },
  { category: "Món ăn", name: "Grilled Salted Yellowtail Fish Gills / Mang cá cam nướng muối", price: 179000 },
  { category: "Món ăn", name: "Grilled Stingray fins / Vây cá đuối nướng", price: 149000 },
  { category: "Món ăn", name: "Grilled beef Roll with Enoki Mushroom / Bò cuộn nấm kim châm nướng", price: 159000 },
  { category: "Món ăn", name: "Teriyaki Sauce Beef Grilled / Bò nướng sốt teriyaki", price: 159000 },
  { category: "Món ăn", name: "Grilled Cheese Crab Shell / Mai cua nướng phô mai", price: 189000 },
  { category: "Món ăn", name: "Garlic Butter Razor Clams / Ốc móng tay sốt bơ tỏi", price: 149000 },
  { category: "Món ăn", name: "Wagyu Steak (100gr) / Bò Wagyu Nhật Steak (100gr)", price: 850000 },
  { category: "Món ăn", name: "Fried oyster / Hàu Nhật chiên", price: 179000 },
  { category: "Món ăn", name: "Fried chicken gizzard / Mề gà chiên giòn", price: 109000 },
  { category: "Món ăn", name: "Seafoods Tempura / Tempura Hải Sản", price: 239000 },
  { category: "Món ăn", name: "Steamed egg / Trứng hấp hải sản", price: 79000 },
  { category: "Món ăn", name: "Japanese-style Fried Dumplings /  Há cảo chiên kiểu Nhật", price: 99000 },
  { category: "Món ăn", name: "Fried soft-shell crab / Cua lột chiên", price: 199000 },
  { category: "Món ăn", name: "Cajun Fried Chicken / Gà chiên Cajun", price: 139000 },
  { category: "Món ăn", name: "Squid tempura / Mực lăn bột chiên", price: 149000 },
  { category: "Món ăn", name: "Fried Vegetable / Rau củ thập cẩm chiên", price: 109000 },
  { category: "Món ăn", name: "SWEET JAPANESE SHRIMP Sushi / SUSHI TÔM NGỌT NHẬT", price: 169000 },
  { category: "Món ăn", name: "SEA URCHIN Sushi / SUSHI CẦU GAI ( NHUM)", price: 350000 },
  { category: "Món ăn", name: "SURF CLAM Sushi / SUSHI SÒ ĐỎ", price: 99000 },
  { category: "Món ăn", name: "Salmon Sushi / Sushi cá hồi", price: 79000 },
  { category: "Món ăn", name: "Herring Sushisushi /  Cá trích ép trứng", price: 79000 },
  { category: "Món ăn", name: "KEM HẠNH NHÂN", price: 50000 },
  { category: "Món ăn", name: "TRÁI CÂY THEO MÙA 2", price: 600000 },
  { category: "Món ăn", name: "KEM YUZU NHẬT", price: 119000 },
  { category: "Món ăn", name: "KEM MOCHI NHẬT", price: 50000 },
  { category: "Món ăn", name: "KEM TRÀ XANH NHẬT", price: 50000 },
  { category: "Món ăn", name: "KEM SOCOLA", price: 50000 },
  { category: "Món ăn", name: "KEM ĐÀO", price: 50000 },
  { category: "Món ăn", name: "KEM XOÀI", price: 50000 },
  { category: "Món ăn", name: "KEM VINALA", price: 50000 },
  { category: "Món ăn", name: "SET MENU ĐẶC BIỆT 2000++", price: 2000000 },
  { category: "Món ăn", name: "Sò Điệp Xào Măng Tây", price: 279000 },
  { category: "Món ăn", name: "Rau Xào & Nấm Thập Cẩm", price: 149000 },
  { category: "Món ăn", name: "Bạch quả rang muối - Roasted gingko nuts", price: 85000 },
  { category: "Món ăn", name: "Đậu nành luộc muối - Boiled green beans", price: 78000 },
  { category: "Món ăn", name: "Bụng cá ngừ sashimi", price: 728000 },
  { category: "Món ăn", name: "Tôm ngọt sashimi", price: 328000 },
  { category: "Món ăn", name: "Cơm trắng", price: 30000 },
  { category: "Món ăn", name: "Khoai tây chiên", price: 128000 },
  { category: "Món ăn", name: "Hạt bí", price: 120000 },
  { category: "Món ăn", name: "Hạt thông", price: 120000 },
  { category: "Món ăn", name: "Ba loại hạt khai vị (Hạt bí, hạt thông, hạt điều)", price: 270000 },
  { category: "Món ăn", name: "Trứng Hấp Cua, Sốt Nấm Truffle và Trứng Cá Hồi", price: 249000 },
  { category: "Món ăn", name: "Món Khai Vị Theo Mùa (Rong biển cay lạnh, bạch tuộc sốt wasabi, sò điệp cay)", price: 279000 },
  { category: "Món ăn", name: "Sò Điệp Sốt Kimchi Hàn Quốc", price: 179000 },
  { category: "Món ăn", name: "Tép Chiên Giòn (Koebi Karaage)", price: 99000 },
  { category: "Món ăn", name: "Đĩa Khai Vị Tổng Hợp", price: 279000 },
  { category: "Món ăn", name: "Sò Điệp Xốt Cay", price: 149000 },
  { category: "Món ăn", name: "Bạch Tuộc  Wasabi", price: 119000 },
  { category: "Món ăn", name: "Cơm Chiên Cá Hồi và Trứng Cá Hồi", price: 249000 },
  { category: "Món ăn", name: "Striploin Black Angus (150 ngày) Sốt Tiêu Đen và Wasabi Kizami", price: 749000 },
  { category: "Món ăn", name: "Đầu Cá Hồi Nướng, Xốt Teri", price: 249000 },
  { category: "Món ăn", name: "Hàu Nhật Nướng, Xốt Trứng Cá Tuyết", price: 179000 },
  { category: "Món ăn", name: "Nấm Đùi Gà Nướng, Xốt Teri Cay", price: 79000 },
  { category: "Món ăn", name: "Xiên Nướng Tổng Hợp (05 Loại)", price: 379000 },
  { category: "Món ăn", name: "Xiên Nướng Tổng Hợp (07 Loại)", price: 549000 },
  { category: "Món ăn", name: "Xiên Nướng Rau Củ Tổng Hợp", price: 179000 },
  { category: "Món ăn", name: "Bò Wagyu A4 Nướng, Xốt Tiêu -Nấm Truffle", price: 1279000 },
  { category: "Món ăn", name: "Bò Black Angus MB4 Nướng, Xốt Tiêu Nấm Truffle", price: 799000 },
  { category: "Món ăn", name: "Hàu Hyogo Nướng Sốt Mentaiko (2 con)", price: 199000 },
  { category: "Món ăn", name: "Cá Hồi Nướng Sốt Ume", price: 379000 },
  { category: "Món ăn", name: "Cá Răng Nam Cực Nướng Sốt Saikyo Miso", price: 649000 },
  { category: "Món ăn", name: "Má Heo Iberico Nướng Sốt Cay", price: 349000 },
  { category: "Món ăn", name: "Tôm Hùm Baby Nướng Xốt Trứng Cá Tuyết", price: 899000 },
  { category: "Món ăn", name: "Lươn Nhật Nướng Than sốt Lươn", price: 379000 },
  { category: "Món ăn", name: "Cá Hồi Nướng Sốt Teri Trái Mơ", price: 279000 },
  { category: "Món ăn", name: "Mang Cá Cam Nướng, Xốt Quýt Nhật Cay", price: 349000 },
  { category: "Món ăn", name: "Salad Bò Sốt Saikyo", price: 279000 },
  { category: "Món ăn", name: "Sashimi Cá Tráp Đỏ Kèm Tảo Nori/ Madai Sashimi Carpaccio", price: 249000 },
  { category: "Món ăn", name: "Cá Cam Sốt Yuzu/ Kanpachi", price: 279000 },
  { category: "Món ăn", name: "Cá Hồi Tataki", price: 249000 },
  { category: "Món ăn", name: "Sò Điệp/Scallop Sushi", price: 199000 },
  { category: "Món ăn", name: "Bánh Dân Gian", price: 500000 },
  { category: "Món ăn", name: "Soba Waguy", price: 450000 },
  { category: "Món ăn", name: "Trứng Cầu Gai/ Sea Urchin Sushi", price: 749000 },
  { category: "Món ăn", name: "Thăn Cá Ngừ/ Blue Fin Lean Tuna Sushi", price: 249000 },
  { category: "Món ăn", name: "FG. Thiên Nam Combo", price: 1320000 },
  { category: "Món ăn", name: "FG. Thiên Nam Combo 9", price: 1450000 },
  { category: "Món ăn", name: "Tôm hùm sống nha trang (Size L) / Sashimi nha trang live lobster", price: 3900000 },
  { category: "Món ăn", name: "Set Canape đặc biệt", price: 700000 },
  { category: "Món ăn", name: "Tôm Ngọt/ Sweet Shrimp Sushi", price: 219000 },
  { category: "Món ăn", name: "WINE FREE FLOW", price: 890000 },
  { category: "Món ăn", name: "Bánh Mì", price: 60000 },
  { category: "Món ăn", name: "Bánh Mì 10k", price: 10000 },
  { category: "Món ăn", name: "Bánh Mì Bơ tỏi", price: 72000 },
  { category: "Món ăn", name: "Bánh Mì 16k", price: 16000 },
  { category: "Món ăn", name: "Bánh Mì 76k", price: 76000 },
  { category: "Món ăn", name: "Ốc Hương Xào Bơ Bắp", price: 600000 },
  { category: "Món ăn", name: "Nghêu Hấp", price: 600000 },
  { category: "Món ăn", name: "Chả giò", price: 179000 },
  { category: "Món ăn", name: "Hủ tiếu bò viên", price: 650000 },
  { category: "Món ăn", name: "Kem vani", price: 119000 },
  { category: "Món ăn", name: "SET MENU ĐẶC BIỆT 2500++", price: 2500000 },
  { category: "Món ăn", name: "Cháo", price: 200000 },
  { category: "Món ăn", name: "Soup", price: 200000 },
  { category: "Món ăn", name: "Cá Nâu Nướng", price: 649000 },
  { category: "Món ăn", name: "BUFFET PARTY SET", price: 1000000 },
  { category: "Món ăn", name: "SET MENU 2700", price: 2700000 },
  { category: "DÉCOR", name: "DECOR PARTY", price: 13000000 },
  { category: "Món ăn", name: "BUFFET UNLIMITED", price: 1050000 },
  { category: "Món ăn", name: "Cá Đục Chiên Giòn", price: 179000 },
  { category: "Món ăn", name: "Dưa kiệu và trứng", price: 179000 },
  { category: "Món ăn", name: "Xúc Xích Đức", price: 179000 },
  { category: "Món ăn", name: "Khô Cá Sụn Sịn", price: 179000 },
  { category: "Món ăn", name: "SET MENU 3500", price: 3500000 },
  { category: "Món ăn", name: "Hủ tiếu bò viên 300k", price: 300000 },
  { category: "Món ăn", name: "Gân thêm", price: 150000 },
  { category: "Món ăn", name: "Đầu hành", price: 50000 },
  { category: "Món ăn", name: "Khoai lang chiên", price: 59000 },
  { category: "Món ăn", name: "Củ Sen Chiên", price: 59000 },
  { category: "Món ăn", name: "Rau luộc, 4 trứng luộc", price: 360000 },
  { category: "Món ăn", name: "Lẩu Cá Madai", price: 850000 },
  { category: "Món ăn", name: "Khô mực 450k", price: 450000 },
  { category: "Món ăn", name: "Sò Huyết Nướng Mọi", price: 600000 },
  { category: "Món ăn", name: "Rau luộc", price: 149000 },
  { category: "Món ăn", name: "Khô mực 149k", price: 149000 },
  { category: "Món ăn", name: "Xôi lele", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC EVIAN / 750ML", price: 160000 },
  { category: "Đồ uống đóng chai", name: "The Maccallan 12 Sherry Oak", price: 4500000 },
  { category: "Đồ uống đóng chai", name: "The Maccallan 15 Double Cask", price: 7800000 },
  { category: "Đồ uống đóng chai", name: "The Maccallan 18 Double Cask", price: 18900000 },
  { category: "Đồ uống đóng chai", name: "The Glenlivet 12", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "The Glenlivet 15", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "The Glenlivet 18", price: 6100000 },
  { category: "Đồ uống đóng chai", name: "The Glenlivet 21", price: 13600000 },
  { category: "Đồ uống đóng chai", name: "The Glenlivet 25", price: 21500000 },
  { category: "Đồ uống đóng chai", name: "Glenfiddich 15", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "Balvenie 14", price: 5500000 },
  { category: "Đồ uống đóng chai", name: "Singleton 15", price: 4600000 },
  { category: "Đồ uống đóng chai", name: "Laphroaig 10", price: 3200000 },
  { category: "Đồ uống đóng chai", name: "Matsui Mizunara cask", price: 5900000 },
  { category: "Đồ uống đóng chai", name: "Kurayoshi 8", price: 5900000 },
  { category: "Đồ uống đóng chai", name: "Naked Malt", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "Ballantine 17", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "Ballantine 21", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "Ballantine 30", price: 12400000 },
  { category: "Đồ uống đóng chai", name: "Chivas Mizunara", price: 2700000 },
  { category: "Đồ uống đóng chai", name: "Chivas 18 Mizunara", price: 3700000 },
  { category: "Đồ uống đóng chai", name: "Chivas Regal 18 Blue Signature", price: 3300000 },
  { category: "Đồ uống đóng chai", name: "Chivas Regal 25", price: 13500000 },
  { category: "Đồ uống đóng chai", name: "Chivas Royal Salute 21", price: 5500000 },
  { category: "Đồ uống đóng chai", name: "JW Blue Label", price: 8700000 },
  { category: "Đồ uống đóng chai", name: "Wild Turkey 8 year", price: 1750000 },
  { category: "Đồ uống đóng chai", name: "Bulleit", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "Jack Daniel", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Hennessy VSOP", price: 3300000 },
  { category: "Đồ uống đóng chai", name: "Hennessy XO", price: 8600000 },
  { category: "Đồ uống đóng chai", name: "Martell Cordon Bleu", price: 7100000 },
  { category: "Đồ uống đóng chai", name: "Martell XO", price: 9200000 },
  { category: "Đồ uống đóng chai", name: "Kingston 62", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Kraken", price: 1950000 },
  { category: "Đồ uống đóng chai", name: "Skyy", price: 1650000 },
  { category: "Đồ uống đóng chai", name: "Belvedere", price: 2350000 },
  { category: "Đồ uống đóng chai", name: "Grey Goose", price: 2700000 },
  { category: "Đồ uống đóng chai", name: "Beefeater", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "Roku", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "Hendrick", price: 2900000 },
  { category: "Đồ uống đóng chai", name: "No.3", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "Kinobi", price: 3600000 },
  { category: "Đồ uống đóng chai", name: "Jose Cuervo", price: 1250000 },
  { category: "Đồ uống đóng chai", name: "Patron XO café", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "1800 Cristalino", price: 3400000 },
  { category: "Đồ uống đóng chai", name: "Don Julio 1942", price: 10000000 },
  { category: "Đồ uống đóng chai", name: "Claze Azul Reposado", price: 12000000 },
  { category: "Đồ uống đóng chai", name: "Kavalan Port Cask", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "Kavalan Tripple Sherry Cask", price: 4700000 },
  { category: "Đồ uống đóng chai", name: "Salon, Le Mesnil Blanc de Blancs", price: 48000000 },
  { category: "Đồ uống đóng chai", name: "Comtes, Blanc de blanc", price: 15900000 },
  { category: "Đồ uống đóng chai", name: "Dom Perignon", price: 11800000 },
  { category: "Đồ uống đóng chai", name: "Tattinger, Prelude Grand Cru Brut", price: 5300000 },
  { category: "Đồ uống đóng chai", name: "Tattinger, Prestige Rose", price: 4700000 },
  { category: "Đồ uống đóng chai", name: "J.M Labruyere, Prologue", price: 4100000 },
  { category: "Đồ uống đóng chai", name: "GH Mumm Grand Cordon", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "Delamote, Brute", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "Bottega Milesimato, Spumante Bianco", price: 950000 },
  { category: "Đồ uống đóng chai", name: "Olivier Leflaive, Meursault - Chardonany", price: 6700000 },
  { category: "Đồ uống đóng chai", name: "Domaine Huet, Clos du Bourg \"Demi Sec\"", price: 4600000 },
  { category: "Đồ uống đóng chai", name: "Louis Jadot, Pouilly Fuisse- Chardonnay", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "Rimapere by Baron Edmond de Rothschild", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "Henri Bourgeois, 'En Travertin', Pouilly Fume", price: 1800000 },
  { category: "Đồ uống đóng chai", name: "Concha Y Toro, Marques de Casa Concha, Chardonnay", price: 1750000 },
  { category: "Đồ uống đóng chai", name: "D' Arenberg, The Olive Grove- Chardonnay", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "Trimbach, Alsace -  Gewurztraminer", price: 1650000 },
  { category: "Đồ uống đóng chai", name: "Guigal, Cotes du Rhone - Rhone Blend", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Gunderloch, \"Fritz\" - Riesling", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Clay Creek, California- Chardonnay", price: 1550000 },
  { category: "Đồ uống đóng chai", name: "Villa Maria, Private Bin Sauvignon", price: 1500000 },
  { category: "Đồ uống đóng chai", name: "Vidal Estate by Villa Maria", price: 1500000 },
  { category: "Đồ uống đóng chai", name: "Banfi, Le Rime, IGT Tuscany- Pinot Grigio", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Torres, Vina Esmeralda Semi Dry White", price: 1150000 },
  { category: "Đồ uống đóng chai", name: "Opus One 2017- Cabernet Sauvignon", price: 24000000 },
  { category: "Đồ uống đóng chai", name: "Chateau Palmer 2008, Margaux 3rd Grand Cru", price: 19700000 },
  { category: "Đồ uống đóng chai", name: "Chateau Clinet, Pomerol-  Merlot", price: 7200000 },
  { category: "Đồ uống đóng chai", name: "Pauillac De Chateau Latour- Bordeaux Blend", price: 5900000 },
  { category: "Đồ uống đóng chai", name: "Chateau Larcis Ducasse, St. Emilion 1st Grand Cru Classe", price: 5700000 },
  { category: "Đồ uống đóng chai", name: "Chateau Rouget, Pomerp- Merlot", price: 4600000 },
  { category: "Đồ uống đóng chai", name: "Chateau Malescot St Exupery, Margaux 3rd Grand Cru", price: 4900000 },
  { category: "Đồ uống đóng chai", name: "Chateau Hyon la Fleur", price: 4400000 },
  { category: "Đồ uống đóng chai", name: "Chateau Prieure Lichine, Margaux 4th Grand Cru Classe", price: 4200000 },
  { category: "Đồ uống đóng chai", name: "Castello Banfi, Brunello di Montalcino DOCG", price: 4100000 },
  { category: "Đồ uống đóng chai", name: "Masi Costasera, Amarone della Valpolicella Classico DOCG", price: 4100000 },
  { category: "Đồ uống đóng chai", name: "Chateau Mont Redon, Chateauneuf du Pape", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "Chateau Saint Andre, Montagne Saint Emilion", price: 2900000 },
  { category: "Đồ uống đóng chai", name: "Cum Laude, Castello Banfi, IGT Tuscany", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "Louis Jadot,Cote de Beaune Villages- Pinot Noir", price: 2300000 },
  { category: "Đồ uống đóng chai", name: "D'Arenberg, The Footbolt-  Shiraz", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "Concha Y Toro, Gran Reserva, Colchagua Valley-  Cabernet Sauvignon", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Concha Y Toro, Gran Reserva, Colchagua Valley-  Carmenere", price: 1500000 },
  { category: "Đồ uống đóng chai", name: "Alvaro Palacios, La Vendimia- Garnacha/ Tempranillo", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Ronan By Chateau Clinet-  Merlot", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Banfi, Col Di Sasso,Tuscany-  Sangiovese/Cabernet Sauvignon", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Maison Castel,  Bordeaux-  Merlot", price: 1150000 },
  { category: "Đồ uống đóng chai", name: "Miguel Torres, Santa Digna-  Cabernet Sauvignon", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Villa Garrel Rose, Cotes de Provence-  Cinsault Grenache", price: 1500000 },
  { category: "Đồ uống đóng chai", name: "Maison Castel Rose, IGP d'Oc-  Merlot", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "DE BORTOLI EMERI'S GARDEN PINK MOSCATO", price: 1000000 },
  { category: "Đồ uống đóng chai", name: "UMESHU Kodawari Mi-Iri Nakata 12% 720ml", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "UMESHU Honkaku Umeshu Monogatari 12% 1800ml", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Shochu Kaido Iwa No Aka 720ml", price: 900000 },
  { category: "Đồ uống đóng chai", name: "Dassai 23 16%", price: 4500000 },
  { category: "Đồ uống đóng chai", name: "Dassai 39 16% 720ML", price: 2900000 },
  { category: "Đồ uống đóng chai", name: "Dassai 39 16% 300ML", price: 1500000 },
  { category: "Đồ uống đóng chai", name: "Dassai 45 16% 720ML", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "Dassai 45 16% 300ML", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "Shochikubai Fushimizujitate Kyoto Junmai 13-14%", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Shochikubai Fushimizujitate Kyoto Junmai 13-14% (nhỏ)", price: 750000 },
  { category: "Đồ uống đóng chai", name: "Asashibori Shuppintyozousyu Honjozo 20%", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Yamada Nishiki 14% 1800ML", price: 2900000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Yamada Nishiki 14% 720ML", price: 1200000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Yamada Nishiki 14% 300ML", price: 590000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Hozonjo Karatamba 15% 1800ML", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Hozonjo Karatamba 15% 720ML", price: 990000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Hozonjo Karatamba 15% 300ML", price: 460000 },
  { category: "Đồ uống đóng chai", name: "Gekkeikan Tokubetsu with Gold Foil 15%", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "Gekkeikan Daiginjo Fukuro Shibori 16% - 17% (Limited)", price: 7900000 },
  { category: "Đồ uống đóng chai", name: "Horin Junmai Daiginjo 16% 1800ML", price: 4600000 },
  { category: "Đồ uống đóng chai", name: "Horin Junmai Daiginjo 16% 720ML", price: 3400000 },
  { category: "Đồ uống đóng chai", name: "Horin Junmai Daiginjo 16% 300ML", price: 890000 },
  { category: "Đồ uống đóng chai", name: "Gekkeikan Daiginjo 15% 720ML", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Gekkeikan Daiginjo 15% 300ML", price: 450000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Daiginjo Choju 16%", price: 7300000 },
  { category: "Đồ uống đóng chai", name: "Chotokusen Osakaya Chobei Daiginjo 15% 1800ML", price: 2990000 },
  { category: "Đồ uống đóng chai", name: "Chotokusen Osakaya Chobei Daiginjo 15% 720ML", price: 1800000 },
  { category: "Đồ uống đóng chai", name: "Chotokusen Osakaya Chobei Daiginjo 15% 300ML", price: 790000 },
  { category: "Đồ uống đóng chai", name: "Ozeki Barrel 15%", price: 3700000 },
  { category: "Đồ uống đóng chai", name: "Snow aged Junmai Daiginjo 3 years Hakkaisan (Yukimuro) 17%", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "Shichiken Sparkling 11%", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "Kagatobi Junmai Nigori Sparkling", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Gekkeikan Nigori 10,5%", price: 550000 },
  { category: "Đồ uống đóng chai", name: "Gunderloch, \"Fritz\" - Riesling, Germany", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Guigal, Cotes du Rhone - Rhone Blend, France", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Bushmill blackbush", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "Evian Glass 75CL", price: 110000 },
  { category: "Đồ uống đóng chai", name: "Evian Glass 33CL", price: 78000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Vang F Negroamaro", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "BIA TIGER  CRYSTAL", price: 160000 },
  { category: "Đồ uống đóng chai", name: "PHÍ COCKTAIL", price: 100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MACALLAN 12 SHERRY CASK", price: 6300000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MACALLAN 15 DOUBLE CASK", price: 9900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MACALLAN 18 DOUBLE CASK", price: 25000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE GLENLIVET 12", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE GLENLIVET 15", price: 4700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE GLENLIVET 18", price: 8600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE GLENLIVET 21", price: 18800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE GLENLIVET 25", price: 30800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU GLENFIDDICH 15", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU GLENFIDDICH 18", price: 6200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BALVENIE 14", price: 6900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BALVENIE 21", price: 22000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SINGLETON 12", price: 3100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SINGLETON 15", price: 5000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU LAPHROAIG 10", price: 3700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BOWMORE 12", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BOWMORE 15", price: 5200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BOWMORE 18", price: 7900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHIVAS MINUZARA", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHIVAS MINUZARA 18", price: 5300000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHIVAS REGAL 18 BLUE SIGNATURE", price: 4300000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHIVAS ROYAL SALUTE 21", price: 7300000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHIVAS REGAL 25", price: 13500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BALLANTINE 17", price: 3600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BALLANTINE 21", price: 5500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BALLANTINE 30", price: 16700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU JOHNNIE WALKER BLUE LABEL", price: 11200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU JOHNNIE WALKER DOUBLE BLACK", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU NAKED MALT", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MATSUI MIZUNARA CASK", price: 7500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MATSUI KURAYOSHI 8YO", price: 7600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU KAKUBIN SUNTORY", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU HIBIKI HARMONY", price: 9500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE YAMAZAKI DISTILLERS RESERVE", price: 9200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU THE HAKUSHU DISTILLERS RESERVE", price: 9500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU HENNESSY VSOP", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU HENNESSY X.O", price: 9800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MARTELL CORDON BLEU", price: 9400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MARTELL X.O", price: 11500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Palmer 2008, Margaux 3rd Grand Cru Classe, Merlot/ Cabernet Sauvignon", price: 29000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Clinet, Pomerol, Bordeaux Blend", price: 7700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Pauillac De Chateau Latour, Bordeaux Blend", price: 7900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Larcis Ducasse, St. Emilion 1st Grand Cru Classe, Bordeaux Blend", price: 7700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Malescot St Exupery, Margaux 3rd Grand Cru Classe, Bordeaux Blend", price: 6200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Rouget, Pomerol, Bordeaux Blend", price: 5700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Hyon la Fleur,Merlot / Cabernet Sauvignon", price: 4800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Prieure Lichine, Margaux 4th Grand Cru Classe, Bordeaux Blend", price: 5600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Mont Redon, Chateauneuf du Pape, Grenache / Syrah/ Mourvedre", price: 3800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Chateau Saint Andre, Montagne Saint Emilion, Merlot/ Cab Sauvignon", price: 2700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Louis Jadot, Cote de Beaune Villages, Pinot Noir", price: 2600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Ronan By Chateau Clinet,Merlot", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Maison Castel, Merlot, Bordeaux", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Opus One 2019, Cabernet Sauvignon", price: 25000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Cum Laude - Banfi Toscana, Italy", price: 2400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Castello Banfi, Brunello di Montalcino DOCG, Sangiovese,Italy", price: 4800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Masi Costasera, Amarone della Valpolicella Classico DOCG,Corvina/ Rondinella /Molinara,Italy", price: 4800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Alvaro Palacios, La Vendimia, Garnacha/ Tempranillo", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Concha Y Toro, Gran Reserva, Carmenere", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU La Joya Gran Reserva Syrah", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Trimbach, Gewurztraminer, Alsace", price: 2400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Guigal, Cotes du Rhone, Rhone Blend", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Domaine Huet, Clos du Bourg \"Demi Sec\", Chenin Blanc", price: 4800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Henri Bourgeois, 'En Travertin', Pouilly Fume, Sauvignon Blanc", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Olivier Leflaive, Meursault, Chardonany", price: 6700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Louis Jadot, Pouilly Fuisse, Chardonnay", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Clay Creek Chardonnay", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU D' Arenberg, The Olive Grove, Chardonnay", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Torres, Vina Esmeralda Semi Dry White, Gewurztraminer Moscato", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Concha Y Toro, Marques De Casa Concha Chardonnay", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Vidal Estate by Villa Maria, Sauvignon Blanc, Malborough Valley", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Villa Maria, Private Bin Sauvignon, Marlborough, Sauvignon Blanc", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Rimapere by Baron Edmond de Rothschild", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Gunderloch, \"Fritz\" ,Riesling", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Villa Garrel Rose, Cotes de Provence, Cinsault Grenache", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Maison Castel Rose, IGP d'Oc", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "Miguel Torres, Santa Digna , Cabernet Sauvignon, Chile", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Bottega, Millesimato Brut, Spumante Bianco,Veneto, Italy", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Delamotte, Brut,France", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE J.M. Labruyere, Prologue, Grand Cru,France", price: 12200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Taittinger, Brut Prestige Rose, France", price: 5100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Taittinger, Prelude Grands Crus Brut, France", price: 6000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE G.H Mumm Grand Cordon", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Comtes De CHAMPAGNE Grands Crus - Blanc de blanc", price: 19500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Salon, Le Mesnil Blanc de Blancs, France", price: 52400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Tribaut Schloesser 750ml, 12-15%", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CHAMPAGNE Dom Perignon, Vintage Brut", price: 12000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Hozonjo Karatamba 15% 300ml", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Hozonjo Karatamba 15% 720ml", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Hozonjo Karatamba 15% 1800ml", price: 2400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Yamada Nishiki 14% 300ml", price: 1200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Yamada Nishiki 14% 720ml", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Yamada Nishiki 14% 1800ml", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Dassai 45 16% -300ml", price: 1200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Dassai 45 16% -720ml", price: 2400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Dassai 39 16% -300ml", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Dassai 39 16% -720ml", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Dassai 23 16% -720ml", price: 4700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Asashibori Shuppintyozousyu Honjozo 20% 900ml", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Shochikubai Fushimizujitate Kyoto Junmai 13-14% 700ML", price: 1200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Shochikubai Fushimizujitate Kyoto Junmai 13-14% 1800ML", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Gekkeikan Daiginjo 15% 300ml", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Gekkeikan Daiginjo 15% 720ml", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Gekkeikan Nigori 10,5% 300ml", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Horin Junmai Daiginjo 16% 300ml", price: 1200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Horin Junmai Daiginjo 16% 720ml", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Horin Junmai Daiginjo 16% 1,800ml", price: 4700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Gekkeikan Tokubetsu with Gold Foil 15% 1800ml", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Gekkeikan Daiginjo Fukuro Shibori 16% - 17% 720ml (Limited)", price: 7900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Ozeki Barrel 15% 1800ml", price: 3700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Chotokusen Osakaya Chobei Daiginjo 15% 300ml", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Chotokusen Osakaya Chobei Daiginjo 15% 720ml", price: 1900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Chotokusen Osakaya Chobei Daiginjo 15% 1800ml", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Daiginjo Choju 16% 720ml", price: 7300000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Snow aged Junmai Daiginjo 3 years Hakkaisan (Yukimuro)17% (720ml)", price: 3500000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Shichiken Sparkling 11% (720ml)", price: 2400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kagatobi Junmai Nigori Sparkling 720ml", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kubota Junmai Daiginjo 15% 300ml", price: 1100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kubota Junmai Daiginjo 15% 720ml", price: 2100000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kubota Senju Ginjo 15% 300ml", price: 1000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kubota Senju Ginjo 15% 720ml", price: 1800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SAKE Kubota Senju Ginjo 15% 1800ml", price: 3300000 },
  { category: "Đồ uống đóng chai", name: "SAIGON SPECIAL ", price: 110000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SHOCHU KHOAI LANG KAIDO IWA NO AKA / 720 ML", price: 1400000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU Umeshu Kodawari Mi-Iri Nakata / 720ML / 12%", price: 1700000 },
  { category: "Đồ uống đóng chai", name: "BIA TIGER / 330ML", price: 160000 },
  { category: "Đồ uống đóng chai", name: "BIA HEINEKEN / 330ML", price: 160000 },
  { category: "Đồ uống đóng chai", name: "BIA SAPPORO / 330ML", price: 160000 },
  { category: "Đồ uống đóng chai", name: "BIA CORONA / 355ML", price: 160000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC COKE / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC DIET COKE / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC RED BULL / 250ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC SPRITE / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC GINGER ALE / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC SODA / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC TONIC / 320ML", price: 110000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC EVIAN / 750ML", price: 140000 },
  { category: "Đồ uống đóng chai", name: "NƯỚC PERRIER / 750ML", price: 140000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU SKYY VODKA", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU HAKU", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU ABSOLUTE ELYX 1L", price: 4200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU GREY GOOSE", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU KETEL ONE", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU TANQUERAY", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU ROKU", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU LONDON NO.3", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU HENDRICK'S", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU KINOBI KYOTO", price: 4200000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU KINGSTON 62 WHITE", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU KRAKEN", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU JOSE CUERVO TRADICTIONAL", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU 1800 CRISTALINO", price: 3900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU CLASE AZUL REPOSADO", price: 14700000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU PATRON X.O", price: 3600000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU DON JULIO 1942", price: 12900000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU DON JULIO BLANCO", price: 3000000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU BULLEIT", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU WILD TURKEY 8 YEAR", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU JACK DANIEL", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "RƯỢU MAKER'S MARK", price: 2800000 },
  { category: "Đồ uống đóng chai", name: "BO.Kingston 62", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX -NƯỚC COKE / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC DIET COKE / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC GINGER ALE / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC RED BULL / 250ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC SPRITE / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC TONIC / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "SOFT DRINK MIX NƯỚC SODA / 320ML", price: 0 },
  { category: "Đồ uống đóng chai", name: " Rượu Veuve Ambal Méthode Traditionnelle Blanc De Blancs ", price: 0 },
  { category: "Đồ uống đóng chai", name: "GBA_SAPPORO 330ML", price: 56277 },
  { category: "Đồ uống đóng chai", name: "GBA_TIGER CRYSTAL", price: 56277 },
  { category: "Đồ uống đóng chai", name: "GBA_COKE", price: 52910 },
  { category: "Đồ uống đóng chai", name: "GBA_Diet Coke", price: 52910 },
  { category: "Đồ uống đóng chai", name: "GBA_Ginger Ale", price: 52910 },
  { category: "Đồ uống đóng chai", name: "GBA_Sprite", price: 52910 },
  { category: "Đồ uống đóng chai", name: "COKE", price: 55000 },
  { category: "Đồ uống đóng chai", name: "Soda Schweppes 320ml/ lon", price: 55000 },
  { category: "Đồ uống đóng chai", name: "Tonic Schweppes 330ml/lon", price: 55000 },
  { category: "Đồ uống đóng chai", name: "Soda gừng Schweppes Ginger Ale (330ml/lon)", price: 55000 },
  { category: "Đồ uống đóng chai", name: "Red bull (250ml/lon)", price: 55000 },
  { category: "Đồ uống đóng chai", name: "CORONA", price: 110000 },
  { category: "Đồ uống đóng chai", name: "HEINEKEN", price: 55000 },
  { category: "Đồ uống đóng chai", name: "SAIGON SPECIAL ", price: 55000 },
  { category: "Đồ uống đóng chai", name: "TIGER CRYSTAL", price: 55000 },
  { category: "Đồ uống đóng chai", name: "THE YAMAZAKI 12", price: 8700000 },
  { category: "Đồ uống đóng chai", name: "THE YAMAZAKI 18", price: 31000000 },
  { category: "Đồ uống đóng chai", name: "HIBIKI HARMONY", price: 6300000 },
  { category: "Đồ uống đóng chai", name: "HIBIKI 17", price: 22000000 },
  { category: "Đồ uống đóng chai", name: "HIBIKI 21", price: 24500000 },
  { category: "Đồ uống đóng chai", name: "HIBIKI 30", price: 169000000 },
  { category: "Đồ uống đóng chai", name: "Sake Gekkeikan Daiginjo 15% 720ml (gls)", price: 250000 },
  { category: "Đồ uống đóng chai", name: "SHOCHU KHOAI LANG KAIDO IWA NO AKA 720 ML", price: 1300000 },
  { category: "Đồ uống đóng chai", name: "Rượu mơ Kodawari Mi-Iri Nakata 12% (720ml)", price: 1800000 },
  { category: "Đồ uống đóng chai", name: "THE FAMOUS GROUSE SMOKY BLACK", price: 1800000 },
  { category: "Đồ uống đóng chai", name: "DIET COKE", price: 55000 },
  { category: "Đồ uống đóng chai", name: "SPRITE", price: 55000 },
  { category: "Đồ uống đóng chai", name: "PERRIER 33CL", price: 65000 },
  { category: "Đồ uống đóng chai", name: "PERRIER 75CL", price: 95000 },
  { category: "Đồ uống đóng chai", name: "SAPPORO 330ML", price: 55000 },
  { category: "Đồ uống đóng chai", name: "TIGER", price: 55000 },
  { category: "Đồ uống đóng chai", name: "THE YAMAZAKI 12", price: 8700000 },
  { category: "Đồ uống đóng chai", name: "Rượu Mơ Honkaku Umeshu Monogatari 12% 1800ml", price: 1600000 },
  { category: "Đồ uống đóng chai", name: "Sake Ozeki Yamada Nishiki 14% 720ml (gls)", price: 210000 },
  { category: "Đồ uống đóng chai", name: "Sake Ozeki Hozonjo Karatamba 15% 720ml  (gls)", price: 190000 },
  { category: "Đồ uống đóng chai", name: "Đồ uống thêm", price: 0 },
  { category: "Đồ uống đóng chai", name: "PEPSI CAN 330ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "PEPSI BLACK 330ML", price: 0 },
  { category: "Đồ uống đóng chai", name: "7 up (330ml/lon)", price: 0 },
  { category: "Đồ uống đóng chai", name: "Hibiki Blenders Choice", price: 0 },
  { category: "Đồ uống đóng chai", name: "Bollinger Brut", price: 0 },
  { category: "Đồ uống đóng chai", name: "Bollinger Rose", price: 0 },
  { category: "Đồ uống đóng chai", name: "Evian 300ML", price: 65000 },
  { category: "Đồ uống đóng chai", name: "Evian 1L", price: 95000 },
  { category: "Đồ uống đóng chai", name: "Nước suối Dasani", price: 0 },
  { category: "Đồ uống đóng chai", name: "Evian Still 1,5L", price: 139000 },
  { category: "Đồ uống đóng chai", name: "Evian Sparkling 750ML", price: 95000 },
  { category: "Đồ uống đóng chai", name: "Comtes De Champagne Blanc De B", price: 0 },
  { category: "Đồ uống đóng chai", name: "Champagne Dom Perignon", price: 11800000 },
  { category: "Đồ uống đóng chai", name: "Meursault, Louis Jadot- Chardonnay", price: 4900000 },
  { category: "Đồ uống đóng chai", name: "TROPIC MAGIC", price: 100000 },
  { category: "Đồ uống đóng chai", name: "Set Freeflow đặc biệt", price: 650000 },
  { category: "Đồ uống pha chế", name: "Rượu Youth", price: 0 },
  { category: "Đồ uống pha chế", name: "Rượu Edible Sour", price: 0 },
  { category: "Đồ uống pha chế", name: "Rượu Midori Mist", price: 0 },
  { category: "Đồ uống pha chế", name: "Nước Mango Japanese (Mocktail)", price: 0 },
  { category: "Đồ uống pha chế", name: "Nước Lychee Fizz (Mocktail)", price: 0 },
  { category: "Đồ uống pha chế", name: "Rượu Fugu Sangria", price: 0 },
  { category: "Đồ uống pha chế", name: "Rượu Edible Sour", price: 250000 },
  { category: "Đồ uống pha chế", name: "Rượu Fugu Sangria", price: 250000 },
  { category: "Đồ uống pha chế", name: "BO. Smirnoff", price: 0 },
  { category: "Đồ uống pha chế", name: "OIRAN'S SCENT- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "KAMPAI- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "SHISHOTINI- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "SAMURAI SPRITZ- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "SEI SOUR- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "AKATSUKI- happy hours", price: 0 },
  { category: "Đồ uống pha chế", name: "Rượu Fugu Sangria- Britcharm", price: 125500 },
  { category: "Đồ uống pha chế", name: "Bia Heineken- Britcharm", price: 80500 },
  { category: "Đồ uống pha chế", name: "Bia Tiger- Britcharm", price: 80500 },
  { category: "Đồ uống pha chế", name: "Nước Dasani- Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "Nước Diet Coke- Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "Nước Redbul", price: 110000 },
  { category: "Đồ uống pha chế", name: "Nước Sprite- Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "Nước Ginger Ale - Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "Nước Soda - Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "Nước Tonic - Britcharm", price: 56000 },
  { category: "Đồ uống pha chế", name: "GREEN PANDA", price: 250000 },
  { category: "Đồ uống pha chế", name: "LE  PORFUME", price: 250000 },
  { category: "Đồ uống pha chế", name: "THE FIRST TIME", price: 290000 },
  { category: "Đồ uống pha chế", name: "BRULLEE MARTINI", price: 290000 },
  { category: "Đồ uống pha chế", name: "BOOZE XO", price: 350000 },
  { category: "Đồ uống pha chế", name: "STRANGER THINGS", price: 350000 },
  { category: "Đồ uống pha chế", name: "ITALO", price: 320000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MARTINI ", price: 250000 },
  { category: "Đồ uống pha chế", name: "Gói Freeflow drink", price: 280000 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN BLOOD AND SAND", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN COSMOPOLITAN", price: 0 },
  { category: "Đồ uống pha chế", name: "RƯỢU OLD FASHIONED", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Vodka MartinI", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Whisky Sour", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU B52", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MARGARITA", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Ruby Ember", price: 260000 },
  { category: "Đồ uống pha chế", name: "SET.NƯỚC GUAVE COLLIN", price: 0 },
  { category: "Đồ uống pha chế", name: "NƯỚC LICHI FIZZ", price: 0 },
  { category: "Đồ uống pha chế", name: "SET.NƯỚC MANGO JAPANESE", price: 0 },
  { category: "Đồ uống pha chế", name: "RƯỢU NOJI HIGHBALL", price: 350000 },
  { category: "Đồ uống pha chế", name: "RƯỢU NEGRONI", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BEE'S KNEES", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU LAST CHANGE", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU PALOMA", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BLOOD AND SAND", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MANHATTAN", price: 250000 },
  { category: "Đồ uống pha chế", name: "NƯỚC LICHI FIZZ", price: 200000 },
  { category: "Đồ uống pha chế", name: "NƯỚC GUAVE COLLIN", price: 200000 },
  { category: "Đồ uống pha chế", name: "NƯỚC MANGO JAPANESE", price: 200000 },
  { category: "Đồ uống pha chế", name: "RƯỢU SKYY VODKA", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU SSIE KIK", price: 300000 },
  { category: "Đồ uống pha chế", name: "RƯỢU HAKU", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU GREY GOOSE", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU TOKYO TWILIGHT BO", price: 500000 },
  { category: "Đồ uống pha chế", name: "RƯỢU FASHIONED UMESHU BO", price: 500000 },
  { category: "Đồ uống pha chế", name: "RƯỢU PANDAN JAPANESE BO", price: 500000 },
  { category: "Đồ uống pha chế", name: "RƯỢU KETEL ONE", price: 220000 },
  { category: "Đồ uống bán thành phẩm", name: "RƯỢU Jagermeister", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU TANQUERAY", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU ROKU", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU LONDON NO.3", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU HENDRICK'S", price: 230000 },
  { category: "Đồ uống pha chế", name: "RƯỢU KINOBI KYOTO", price: 360000 },
  { category: "Đồ uống pha chế", name: "RƯỢU KINGSTON 62 WHITE", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU KRAKEN", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU WATERMELON SMOKE", price: 300000 },
  { category: "Đồ uống pha chế", name: "RƯỢU JOSE CUERVO TRADICTIONAL", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU 1800 CRISTALINO", price: 320000 },
  { category: "Đồ uống pha chế", name: "RƯỢU PATRON X.O", price: 290000 },
  { category: "Đồ uống pha chế", name: "RƯỢU DON JULIO BLANCO", price: 240000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BULLEIT", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU WILD TURKEY 8 YEAR", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU JACK DANIEL", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MAKER'S MARK", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MACALLAN 12 SHERRY CASK", price: 540000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MACALLAN 15 DOUBLE CASK", price: 960000 },
  { category: "Đồ uống pha chế", name: "RƯỢU SUNTORY FIX", price: 300000 },
  { category: "Đồ uống pha chế", name: "RƯỢU THE GLENLIVET 12", price: 270000 },
  { category: "Đồ uống pha chế", name: "RƯỢU THE GLENLIVET 15", price: 400000 },
  { category: "Đồ uống pha chế", name: "RƯỢU GLENFIDDICH 15", price: 340000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BALVENIE 14", price: 590000 },
  { category: "Đồ uống pha chế", name: "RƯỢU SINGLETON 12", price: 270000 },
  { category: "Đồ uống pha chế", name: "RƯỢU LAPHROAIG 10", price: 290000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BOWMORE 12", price: 260000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BOWMORE 15", price: 450000 },
  { category: "Đồ uống pha chế", name: "RƯỢU CHIVAS MINUZARA", price: 260000 },
  { category: "Đồ uống pha chế", name: "RƯỢU CHIVAS REGAL 18 BLUE SIGNATURE", price: 370000 },
  { category: "Đồ uống pha chế", name: "RƯỢU FUGU WHEY", price: 350000 },
  { category: "Đồ uống pha chế", name: "RƯỢU BALLANTINE 17", price: 310000 },
  { category: "Đồ uống pha chế", name: "RƯỢU JOHNNIE WALKER DOUBLE BLACK", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU NAKED MALT", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU KAKUBIN SUNTORY", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU HENNESSY VSOP", price: 330000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Maison Castel, Merlot, Bordeaux", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Concha Y Toro, Gran Reserva, Carmenere", price: 290000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Vidal Estate by Villa Maria, Sauvignon Blanc", price: 290000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Maison Castel Rose, IGP d'Oc", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Bottega, Millesimato Brut, Spumante Bianco", price: 220000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MOSCOW MULE", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU TOKYO TWILIGHT", price: 1200000 },
  { category: "Đồ uống pha chế", name: "RƯỢU FASHIONED UMESHU", price: 1200000 },
  { category: "Đồ uống pha chế", name: "RƯỢU PANDAN JAPANESE", price: 1200000 },
  { category: "Đồ uống pha chế", name: "RƯỢU COSMOPOLITAN", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MOJITO", price: 250000 },
  { category: "Đồ uống pha chế", name: "RƯỢU MAI TAI", price: 250000 },
  { category: "Đồ uống pha chế", name: "NƯỚC FREEFLOW 2H", price: 950000 },
  { category: "Đồ uống pha chế", name: "BO.Beefeater(GLS)", price: 0 },
  { category: "Đồ uống pha chế", name: "BO.Jose Cuervo(GLS)", price: 0 },
  { category: "Đồ uống pha chế", name: "BO.RƯỢU Jim Beam ", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN MAI TAI", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN MANHATTAN", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN MOJITO", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN MOSCOW MULE", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN NEGRONI", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN PALOMA", price: 0 },
  { category: "Đồ uống pha chế", name: "FUGU.THANH XUÂN LAST CHANGE", price: 0 },
  { category: "Đồ uống pha chế", name: "V.Dr Sweet", price: 0 },
  { category: "Đồ uống pha chế", name: "NƯỚC 2H", price: 200000 },
  { category: "Đồ uống pha chế", name: "GBA_Vidal Estate by Villa Maria", price: 350649 },
  { category: "Đồ uống pha chế", name: "GBA_Torres, Vina Esmeralda Semi Dry White", price: 259740 },
  { category: "Đồ uống pha chế", name: "GBA_Banfi, Col Di Sasso,Sangiovese/Cabernet Sauvignon", price: 280385 },
  { category: "Đồ uống pha chế", name: "GBA_Maison Castel, Merlot, Bordeaux", price: 259740 },
  { category: "Đồ uống pha chế", name: "The Maccallan 12 Sherry Oak (GLS)", price: 350000 },
  { category: "Đồ uống pha chế", name: "The Glenlivet 12(GLS)", price: 220000 },
  { category: "Đồ uống pha chế", name: "The Glenlivet 15(GLS)", price: 280000 },
  { category: "Đồ uống pha chế", name: "The Glenlivet 18(GLS)", price: 430000 },
  { category: "Đồ uống pha chế", name: "Glenfiddich 15(GLS)", price: 270000 },
  { category: "Đồ uống pha chế", name: "Balvenie 14(GLS)", price: 370000 },
  { category: "Đồ uống pha chế", name: "Singleton 15(GLS)", price: 310000 },
  { category: "Đồ uống pha chế", name: "Laphroaig 10(GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "Naked Malt(GLS)", price: 170000 },
  { category: "Đồ uống pha chế", name: "Ballantine 17 (GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "Chivas Mizunara(GLS)", price: 210000 },
  { category: "Đồ uống pha chế", name: "Chivas Regal 18 Blue Signature(GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "Wild Turkey 8 year (GLS)", price: 140000 },
  { category: "Đồ uống pha chế", name: "Bulleit (GLS)", price: 150000 },
  { category: "Đồ uống pha chế", name: "Jack Daniel (GLS)", price: 120000 },
  { category: "Đồ uống pha chế", name: "Hennessy VSOP (GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "Kingston 62 (GLS)", price: 120000 },
  { category: "Đồ uống pha chế", name: "Kraken(GLS)", price: 150000 },
  { category: "Đồ uống pha chế", name: "Skyy(GLS)", price: 120000 },
  { category: "Đồ uống pha chế", name: "Belvedere(GLS)", price: 210000 },
  { category: "Đồ uống pha chế", name: "Grey Goose(GLS)", price: 210000 },
  { category: "Đồ uống pha chế", name: "Beefeater(GLS)", price: 110000 },
  { category: "Đồ uống pha chế", name: "Roku(GLS)", price: 180000 },
  { category: "Đồ uống pha chế", name: "Hendrick(GLS)", price: 220000 },
  { category: "Đồ uống pha chế", name: "No.3(GLS)", price: 220000 },
  { category: "Đồ uống pha chế", name: "Kinobi (GLS)", price: 270000 },
  { category: "Đồ uống pha chế", name: "Jose Cuervo(GLS)", price: 120000 },
  { category: "Đồ uống pha chế", name: "Patron XO café (GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "1800 Cristalino(GLS)", price: 270000 },
  { category: "Đồ uống pha chế", name: "OLD FASHIONED", price: 200000 },
  { category: "Đồ uống pha chế", name: "NEGRONI", price: 200000 },
  { category: "Đồ uống pha chế", name: "WHISKEY SOUR", price: 200000 },
  { category: "Đồ uống pha chế", name: "DAIQUIRI", price: 200000 },
  { category: "Đồ uống pha chế", name: "MARGARITA", price: 200000 },
  { category: "Đồ uống pha chế", name: "MANHATTAN", price: 200000 },
  { category: "Đồ uống pha chế", name: "MOJITO", price: 200000 },
  { category: "Đồ uống pha chế", name: "GIN FIZZ", price: 200000 },
  { category: "Đồ uống pha chế", name: "MAI TAI", price: 200000 },
  { category: "Đồ uống pha chế", name: "MARTINI COCKTAIL", price: 200000 },
  { category: "Đồ uống pha chế", name: "TOM COLLINS", price: 200000 },
  { category: "Đồ uống pha chế", name: "COSMOPOLTAN", price: 200000 },
  { category: "Đồ uống pha chế", name: "GIN TONIC", price: 200000 },
  { category: "Đồ uống pha chế", name: "OIRAN'S SCENT", price: 230000 },
  { category: "Đồ uống pha chế", name: "KAMPAI", price: 230000 },
  { category: "Đồ uống pha chế", name: "SHISHOTINI", price: 230000 },
  { category: "Đồ uống pha chế", name: "SAMURAI SPRITZ", price: 230000 },
  { category: "Đồ uống pha chế", name: "SEI SOUR", price: 230000 },
  { category: "Đồ uống pha chế", name: "TANGERINE SMASH", price: 130000 },
  { category: "Đồ uống pha chế", name: "HANAMI SEASON", price: 130000 },
  { category: "Đồ uống pha chế", name: "GLORIOUS LADY", price: 130000 },
  { category: "Đồ uống pha chế", name: "B52", price: 130000 },
  { category: "Đồ uống pha chế", name: "SEDUCTION", price: 130000 },
  { category: "Đồ uống pha chế", name: "BLACK RUSSIA", price: 130000 },
  { category: "Đồ uống pha chế", name: "ORGASM", price: 130000 },
  { category: "Đồ uống pha chế", name: "Vidal Estate by Villa Maria-SB( GLS)", price: 350000 },
  { category: "Đồ uống pha chế", name: "Torres, Vina Esmeralda Semi Dry White(GSL)", price: 260000 },
  { category: "Đồ uống pha chế", name: "Maison Castel Rose, IGP d'Oc- Merlot(GLS)", price: 260000 },
  { category: "Đồ uống pha chế", name: "Concha Y Toro, Gran Reserva-CS( GLS)", price: 350000 },
  { category: "Đồ uống pha chế", name: "Banfi, Col Di Sasso,Tuscany(GLS)", price: 280000 },
  { category: "Đồ uống pha chế", name: "Maison Castel,  Bordeaux- Merlot( GLS)", price: 260000 },
  { category: "Đồ uống pha chế", name: "Shochikubai Fushimizujitate Kyoto Junmai(GLS)", price: 210000 },
  { category: "Đồ uống pha chế", name: "Ozeki Hozonjo Karatamba 15%(GLS)", price: 190000 },
  { category: "Đồ uống pha chế", name: "Gekkeikan Daiginjo 15% (GLS)", price: 250000 },
  { category: "Đồ uống pha chế", name: "Akatsuki", price: 230000 },
  { category: "Đồ uống pha chế", name: "Bottega Milesimato, Spumante Bianco (GLS)", price: 230000 },
  { category: "Đồ uống pha chế", name: "WEEKLY NETWORKING - 2HRS FREEFLOW", price: 500000 },
  { category: "Đồ uống pha chế", name: "HOT TEA POT", price: 130000 },
  { category: "Đồ uống pha chế", name: "THE YAMAZAKI 12 (gls) - 45ml", price: 610000 },
  { category: "Đồ uống pha chế", name: "HIBIKI HARMONY (gls) - 45ml", price: 450000 },
  { category: "Đồ uống pha chế", name: "HIBIKI 17 (gls) - 45ml", price: 1500000 },
  { category: "Đồ uống pha chế", name: "HIBIKI 21 (gls) - 45ml", price: 1700000 },
  { category: "Đồ uống pha chế", name: "HIBIKI 30 ( gls) - 45ml", price: 11300000 },
  { category: "Đồ uống pha chế", name: "Jasmine Tea", price: 130000 },
  { category: "Đồ uống pha chế", name: "Earl Grey", price: 130000 },
  { category: "Đồ uống pha chế", name: "Matcha", price: 180000 },
  { category: "Đồ uống pha chế", name: "Trà bưởi hồng / PINK GRAPEFRUIT TEA", price: 100000 },
  { category: "Đồ uống pha chế", name: "Trà bá tước", price: 130000 },
  { category: "Đồ uống pha chế", name: "Espresso (Single shot)", price: 65000 },
  { category: "Đồ uống pha chế", name: "Comtes, De Champagne,  Blanc De Blanc", price: 15900000 },
  { category: "Đồ uống pha chế", name: "Genmaicha (Bình)", price: 130000 },
  { category: "Đồ uống pha chế", name: "B52 (Mới)", price: 120000 },
  { category: "Đồ uống pha chế", name: "OLD FASHIONED PRE", price: 480000 },
  { category: "Đồ uống pha chế", name: "BOULEVADIER PRE", price: 380000 },
  { category: "Đồ uống pha chế", name: "PENICILLIN PRE", price: 420000 },
  { category: "Đồ uống pha chế", name: "MOJITO PRE", price: 250000 },
  { category: "Đồ uống pha chế", name: "DAIQUIRI PRE", price: 250000 },
  { category: "Đồ uống pha chế", name: "MAITAI PRE", price: 250000 },
  { category: "Đồ uống pha chế", name: "GIN TONIC PRE", price: 280000 },
  { category: "Đồ uống pha chế", name: "NEGRONI PRE", price: 350000 },
  { category: "Đồ uống pha chế", name: "MARTINI COCKTAIL PRE", price: 300000 },
  { category: "Đồ uống pha chế", name: "SHISHOTINI PRE", price: 250000 },
  { category: "Đồ uống pha chế", name: "COSMOPOLITAN PRE", price: 290000 },
  { category: "Đồ uống pha chế", name: "SCREWDRIVER PRE", price: 220000 },
  { category: "Đồ uống pha chế", name: "MARGARITA PRE", price: 320000 },
  { category: "Đồ uống pha chế", name: "ROSITA PRE", price: 350000 },
  { category: "Đồ uống pha chế", name: "SIESTA PRE", price: 400000 },
  { category: "Đồ uống pha chế", name: "Espresso (Double)", price: 65000 },
  { category: "Đồ uống pha chế", name: "Americano", price: 65000 },
  { category: "Đồ uống pha chế", name: "Cappuccino", price: 75000 },
  { category: "Đồ uống pha chế", name: "Latte", price: 75000 },
  { category: "Đồ uống pha chế", name: "Irish Coffee", price: 150000 },
  { category: "Đồ uống pha chế", name: "Bạch trà Kim Quang Đỉnh", price: 130000 },
  { category: "Đồ uống pha chế", name: "Hồng trà Đại Sơn Khê", price: 130000 },
  { category: "Đồ uống pha chế", name: "Hồng trà Hồng Nữ Nhi", price: 130000 },
  { category: "Đồ uống pha chế", name: "Lục trà Mộc Thiên Hương", price: 130000 },
  { category: "Đồ uống pha chế", name: "Lục trà hương Sen", price: 130000 },
  { category: "Đồ uống pha chế", name: "Nước cam / ORANGE JUICE", price: 90000 },
  { category: "Đồ uống pha chế", name: "Nước ép nam việt quất / Cranberry juice", price: 80000 },
  { category: "Đồ uống pha chế", name: "GREENLAND", price: 100000 },
  { category: "Đồ uống pha chế", name: "FRUIT FAIRY", price: 100000 },
  { category: "Đồ uống pha chế", name: "Cà phê đen VN", price: 65000 },
  { category: "Đồ uống pha chế", name: "Cà phê sữa VN", price: 65000 },
  { category: "Đồ uống pha chế", name: "Green Tea", price: 130000 },
  { category: "Đồ uống pha chế", name: "Trà ổi hồng / PINK GUAVA TEA", price: 100000 },
  { category: "Đồ uống pha chế", name: "Trà xoài  / MANGO TEA", price: 100000 },
  { category: "Đồ uống pha chế", name: "Trà đào / PEACH TEA", price: 100000 },
  { category: "Đồ uống pha chế", name: "Trà hibicus anh đào", price: 100000 },
  { category: "Đồ uống pha chế", name: "Nước ép thơm / PINEAPPLE JUICE", price: 90000 },
  { category: "Đồ uống pha chế", name: "Nước ép dưa hấu / WATERMELON JUICE", price: 90000 },
  { category: "Đồ uống pha chế", name: "Nước ép táo / RED APPLE JUICE", price: 90000 },
  { category: "Đồ uống pha chế", name: "Nước chanh / LIME JUICE", price: 90000 },
  { category: "Đồ uống pha chế", name: "Bạc xĩu", price: 65000 },
  { category: "Đồ uống pha chế", name: "Trà hoa cúc / CHAMOMILE TEA", price: 130000 },
  { category: "Đồ uống pha chế", name: "Kavalan Lady", price: 0 },
  { category: "Đồ uống pha chế", name: "FreeFlow Unlimited", price: 250000 },
  { category: "Đồ uống pha chế", name: "CHARGE WINE", price: 200000 },
  { category: "Đồ uống pha chế", name: "Bushmill blackbush lady", price: 0 },
  { category: "Đồ uống pha chế", name: "RƯỢU Penicillin", price: 200000 },
  { category: "Đồ uống pha chế", name: "RƯỢU Bee'kness", price: 250000 },
  { category: "Đồ uống pha chế", name: "Corkage Charge whisky", price: 1000000 },
  { category: "Đồ uống pha chế", name: "Corkage Charge 500k", price: 500000 },
  { category: "Đồ uống pha chế", name: "Corkage Charge 2000k", price: 2000000 },
];

export default function CancelReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Trạng thái sắp xếp thời gian (Mới nhất / Cũ nhất)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Quản lý danh sách món (bao gồm món mặc định + món tự thêm mới)
  const [availableItems, setAvailableItems] = useState<any[]>(initialCancelData);

  // STATES FORM NHẬP LIỆU (TỪNG PHIẾU THEO NGÀY)
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<"UNPOSTED" | "POSTED">("UNPOSTED"); 
  const [cartItems, setCartItems] = useState<any[]>([]);

  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  // STATES CHO CHỨC NĂNG THÊM MÓN MỚI
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Món ăn");
  const [newItemPrice, setNewItemPrice] = useState("");

  // ==========================================
  // FETCH DỮ LIỆU TỪ BACKEND
  // ==========================================
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res: any = await fetchData(`/cancel-reports?month=${selectedMonth}`);
      setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedMonth]);

  const formatVND = (num: number) => Math.round(num).toLocaleString("vi-VN") + "đ";

  // Danh sách log đã được sắp xếp theo thời gian
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime();
      const timeB = new Date(b.createdAt || b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [logs, sortOrder]);

  // ==========================================
  // THAO TÁC GIỎ HÀNG (CART POS)
  // ==========================================
  const handleSelectItem = (item: any) => {
    const existing = cartItems.findIndex(i => i.name === item.name);
    if (existing >= 0) {
      const newItems = [...cartItems];
      newItems[existing].quantity += 1;
      setCartItems(newItems);
    } else {
      setCartItems([...cartItems, { 
        category: item.category, 
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }]);
    }
    setItemSearch(""); 
    setShowItemDropdown(false);
    setIsAddingNew(false);
  };

  const handleQtyChange = (index: number, delta: number) => {
    const newItems = [...cartItems];
    newItems[index].quantity += delta;
    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }
    setCartItems(newItems);
  };

  const resetForm = () => {
    setEditId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setType("UNPOSTED");
    setCartItems([]);
    setItemSearch("");
    setIsAddingNew(false);
  };

  // ==========================================
  // THÊM MÓN MỚI VÀO DANH SÁCH TẠM THỜI
  // ==========================================
  const handleAddNewToCart = () => {
    if (!newItemName.trim()) return alert("Vui lòng nhập tên món mới!");
    
    const newItem = {
      category: newItemCategory,
      name: newItemName.trim(),
      price: Number(newItemPrice) || 0
    };

    setAvailableItems(prev => [newItem, ...prev]);
    handleSelectItem(newItem);
    
    setIsAddingNew(false);
    setNewItemName("");
    setNewItemPrice("");
  };

  // ==========================================
  // CRUD ACTIONS
  // ==========================================
  const handleSaveLog = async () => {
    if (cartItems.length === 0) return alert("Phiếu chưa có món nào!");

    const payload = { date, type, items: cartItems };

    try {
      if (editId) await updateData(`/cancel-reports/${editId}`, payload);
      else await postData("/cancel-reports", payload);
      
      resetForm();
      loadData();
      alert("✅ Đã lưu phiếu thành công!");
    } catch (e) { alert("❌ Lỗi khi lưu phiếu!"); }
  };

  const handleEditClick = (log: any) => {
    setEditId(log._id);
    setDate(log.date);
    setType(log.type);
    const mapped = log.items.map((i: any) => ({
      category: i.category, name: i.name, price: i.price, quantity: i.quantity
    }));
    setCartItems(mapped);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Xóa phiếu ghi nhận này?")) return;
    try {
      await deleteData(`/cancel-reports/${id}`);
      loadData();
    } catch (error) { alert("Lỗi xóa phiếu!"); }
  };

  const handleDeleteMonth = async () => {
    if (!window.confirm(`NGUY HIỂM: Bạn có chắc muốn xóa TOÀN BỘ dữ liệu của tháng ${selectedMonth}?`)) return;
    try {
      await deleteData(`/cancel-reports/month/${selectedMonth}`);
      loadData();
      alert("Đã xóa toàn bộ lịch sử tháng!");
    } catch (error) { alert("Lỗi khi xóa tháng!"); }
  };

  // ==========================================
  // TÍNH TOÁN THỐNG KÊ (GOM THEO THÁNG)
  // ==========================================
  const summaryData = useMemo(() => {
    const map: Record<string, any> = {};
    let totalLostValue = 0;

    logs.forEach(log => {
      log.items.forEach((item: any) => {
        if (!map[item.name]) {
          map[item.name] = { category: item.category, name: item.name, price: item.price, unpostedQty: 0, postedQty: 0 };
        }
        if (log.type === "UNPOSTED") {
          map[item.name].unpostedQty += item.quantity;
          // Cộng dồn vào tổn thất nếu là phiếu hủy chưa post
          totalLostValue += (item.quantity * item.price);
        } else if (log.type === "POSTED") {
          map[item.name].postedQty += item.quantity;
          // Trừ bớt khỏi tổn thất nếu là phiếu đã post
          totalLostValue -= (item.quantity * item.price);
        }
      });
    });

    const groups: Record<string, any[]> = {};
    Object.values(map).forEach(item => {
      if (item.unpostedQty > 0 || item.postedQty > 0) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      }
    });

    return { groups, totalLostValue };
  }, [logs]);

  const filteredSuggestions = availableItems.filter(w => w.name.toLowerCase().includes(itemSearch.toLowerCase()));

  // Hàm tính tổng tiền của 1 bill
  const calculateBillTotal = (items: any[]) => items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const calculateBillQty = (items: any[]) => items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="h-full overflow-auto bg-slate-50 p-2 sm:p-6 text-sm font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4 pb-10">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <FileWarning className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Quản Lý Hủy Món</h1>
              <p className="text-[11px] text-slate-500 font-medium">Đối soát Số lượng Hủy và Số lượng Đã Post vào POS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-600 text-xs uppercase tracking-wide">Tháng:</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="bg-transparent border-none text-sm font-bold text-rose-600 outline-none cursor-pointer p-0 m-0 w-24"
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadData} className="h-9 w-9 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors">
              <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}/>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteMonth} className="h-9 font-semibold shadow-sm">
              <Trash2 className="w-4 h-4 mr-1.5"/> Xóa Tháng Này
            </Button>
          </div>
        </div>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="mb-4 h-10 bg-white border border-slate-200 shadow-xs w-full sm:w-auto p-1 rounded-lg">
            <TabsTrigger value="manage" className="text-sm px-6 rounded-md data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all font-medium">
              Ghi Nhận & Lịch Sử
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-sm px-6 rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-medium">
              Thống Kê Tổng Hợp
            </TabsTrigger>
            <TabsTrigger value="bills" className="text-sm px-6 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all font-medium">
              Chi Tiết Các Bill
            </TabsTrigger>
          </TabsList>

          {/* ========================================= */}
          {/* TAB 1: GHI NHẬN & LỊCH SỬ */}
          {/* ========================================= */}
          <TabsContent value="manage" className="space-y-4 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* CỘT TRÁI: FORM NHẬP PHIẾU */}
              <div className="lg:col-span-4 xl:col-span-5 flex flex-col gap-4">
                <Card className={`shadow-md border-0 ring-1 ${editId ? 'ring-amber-400 bg-amber-50/10' : 'ring-slate-200 bg-white'} transition-all`}>
                  <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      {editId ? <><Edit3 className="w-4 h-4 text-amber-600"/> SỬA PHIẾU GHI NHẬN</> : <><ClipboardList className="w-4 h-4 text-rose-600"/> TẠO PHIẾU MỚI</>}
                    </CardTitle>
                    {editId && (
                      <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 px-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50">
                        <XCircle className="w-3 h-3 mr-1"/> Hủy sửa
                      </Button>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-4">
                    {/* THÔNG TIN PHIẾU */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày ghi nhận</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm font-medium border-slate-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loại phiếu</label>
                        <SelectUI value={type} onValueChange={(v: "UNPOSTED"|"POSTED") => setType(v)}>
                          <SelectTrigger className={`h-9 text-xs font-bold border-0 ring-1 ${type === "UNPOSTED" ? 'bg-rose-50 ring-rose-200 text-rose-700' : 'bg-emerald-50 ring-emerald-200 text-emerald-700'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNPOSTED" className="font-bold text-rose-600">🔴 Ghi Nhận HỦY MÓN</SelectItem>
                            <SelectItem value="POSTED" className="font-bold text-emerald-600">🟢 Ghi Nhận ĐÃ POST</SelectItem>
                          </SelectContent>
                        </SelectUI>
                      </div>
                    </div>

                    {/* TÌM KIẾM HOẶC TẠO MỚI MÓN */}
                    <div className={`p-3.5 rounded-xl border space-y-2.5 relative ${type === "UNPOSTED" ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                      <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 ${type === "UNPOSTED" ? "text-rose-700" : "text-emerald-700"}`}>
                        <Search className="w-3.5 h-3.5"/> Chọn món / Thức uống
                      </label>
                      
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1 shadow-sm rounded-md">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Gõ tên món (Bấm để thêm vào phiếu)..." 
                            value={itemSearch} 
                            onFocus={() => setShowItemDropdown(true)} 
                            onBlur={() => setTimeout(() => { setShowItemDropdown(false); setIsAddingNew(false); }, 200)} 
                            onChange={e => setItemSearch(e.target.value)} 
                            className="h-10 pl-9 text-sm font-medium border-slate-300 bg-white" 
                          />
                          
                          {/* DROPDOWN GỢI Ý */}
                          {showItemDropdown && itemSearch && (
                            <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-56 overflow-y-auto divide-y divide-slate-100">
                              {filteredSuggestions.map((w, i) => (
                                  <div key={i} onMouseDown={(e) => { e.preventDefault(); handleSelectItem(w); }} className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center group">
                                    <div>
                                      <span className="font-semibold text-slate-700 group-hover:text-blue-600 text-xs block leading-tight">{w.name}</span>
                                      <span className="text-[9px] text-slate-400">{w.category}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">{formatVND(w.price)}</Badge>
                                  </div>
                              ))}
                              {filteredSuggestions.length === 0 && (
                                <div className="p-3 text-xs text-slate-400 text-center">Không tìm thấy món trong menu</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* NÚT TẠO MÓN MỚI */}
                        <Button 
                          onClick={() => { setIsAddingNew(!isAddingNew); setNewItemName(itemSearch); setShowItemDropdown(false); }} 
                          variant={isAddingNew ? "secondary" : "default"}
                          className={`h-10 px-3 whitespace-nowrap font-bold shadow-sm ${!isAddingNew && "bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                          {isAddingNew ? <XCircle className="w-4 h-4 mr-1"/> : <PlusCircle className="w-4 h-4 mr-1"/>}
                          {isAddingNew ? "Hủy tạo" : "Tạo món mới"}
                        </Button>
                      </div>

                      {/* KHUNG TẠO MÓN MỚI */}
                      {isAddingNew && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row gap-2 items-end shadow-inner transition-all animate-in slide-in-from-top-2">
                          <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold text-blue-800 uppercase">Tên món mới</label>
                            <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nhập tên..." className="h-9 bg-white border-blue-300" />
                          </div>
                          <div className="w-full sm:w-[130px] space-y-1">
                            <label className="text-[10px] font-bold text-blue-800 uppercase">Danh mục</label>
                            <SelectUI value={newItemCategory} onValueChange={setNewItemCategory}>
                              <SelectTrigger className="h-9 bg-white border-blue-300"><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Món ăn">Món ăn</SelectItem>
                                <SelectItem value="Đồ uống pha chế">Đồ uống pha chế</SelectItem>
                                <SelectItem value="Đồ uống đóng chai">Đồ uống đóng chai</SelectItem>
                                <SelectItem value="Khác">Khác</SelectItem>
                              </SelectContent>
                            </SelectUI>
                          </div>
                          <div className="w-full sm:w-[110px] space-y-1">
                            <label className="text-[10px] font-bold text-blue-800 uppercase">Giá (VNĐ)</label>
                            <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0" className="h-9 bg-white border-blue-300 text-center font-bold text-blue-700" />
                          </div>
                          <Button onClick={handleAddNewToCart} className="h-9 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto shadow-sm">
                            Thêm vào phiếu
                          </Button>
                        </div>
                      )}

                      {/* GIỎ HÀNG (CART) */}
                      <div className="mt-3 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 flex justify-between border-b border-slate-100 uppercase tracking-widest">
                          <span>Sản phẩm trong phiếu</span>
                          <span className="w-20 text-center">Số lượng</span>
                        </div>
                        <div className="p-1.5 flex-1 min-h-[140px] max-h-[250px] overflow-y-auto">
                          {cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8 gap-2">
                              <ClipboardList className="w-6 h-6 opacity-40"/>
                              <p className="text-xs font-medium">Phiếu chưa có món nào</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-1">
                              {cartItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg shadow-xs border border-slate-200 group">
                                  <div className="flex-1 flex flex-col justify-center pr-3">
                                    <span className="font-bold text-slate-700 text-xs">{item.name}</span>
                                    <span className="text-[9px] text-slate-400">{item.category}</span>
                                  </div>
                                  <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200 gap-1">
                                    <button
                                        onClick={() => handleQtyChange(idx, -1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:bg-slate-200"
                                    >
                                        <Minus className="w-3 h-3"/>
                                    </button>

                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => {
                                        const value = Number(e.target.value);
                                        const newItems = [...cartItems];
                                        newItems[idx].quantity = value > 0 ? value : 1;
                                        setCartItems(newItems);
                                        }}
                                        className="w-12 h-6 text-center text-xs font-bold border border-slate-300 rounded outline-none"
                                    />

                                    <button
                                        onClick={() => handleQtyChange(idx, 1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:bg-slate-200"
                                    >
                                        <Plus className="w-3 h-3"/>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveLog} className={`w-full h-11 font-black text-sm uppercase tracking-widest shadow-md transition-all rounded-lg ${type === "UNPOSTED" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                      <Save className="w-4 h-4 mr-2"/> {editId ? "CẬP NHẬT PHIẾU NÀY" : `LƯU PHIẾU ${type === "UNPOSTED" ? "HỦY MÓN" : "ĐÃ POST"}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* CỘT PHẢI: LỊCH SỬ CÁC PHIẾU TRONG THÁNG */}
              <div className="lg:col-span-8 xl:col-span-7 flex flex-col h-full">
                <Card className="shadow-md border-0 ring-1 ring-slate-200 h-full flex flex-col bg-white overflow-hidden rounded-xl">
                  <div className="bg-slate-50/80 px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-widest flex justify-between border-b border-slate-100 items-center">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500"/> LỊCH SỬ NHẬP LIỆU THÁNG {selectedMonth}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")} className="h-7 text-[10px] bg-white">
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        {sortOrder === "desc" ? "Mới nhất trước" : "Cũ nhất trước"}
                      </Button>
                      <Badge variant="outline" className="bg-white border-slate-200 font-bold">{logs.length} PHIẾU</Badge>
                    </div>
                  </div>
                  
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 shadow-xs">
                        <TableRow className="border-b-slate-200">
                          <TableHead className="w-[80px] p-3 text-[10px] font-bold uppercase text-slate-500">Ngày</TableHead>
                          <TableHead className="w-[90px] p-3 text-[10px] font-bold uppercase text-slate-500 text-center">Loại</TableHead>
                          <TableHead className="p-3 text-[10px] font-bold uppercase text-slate-500">Chi tiết Món</TableHead>
                          <TableHead className="text-right p-3 text-[10px] font-bold uppercase text-slate-500">Thành Tiền</TableHead>
                          <TableHead className="text-center w-[80px] p-3 text-[10px] font-bold uppercase text-slate-500">Sửa/Xóa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-20 text-slate-400 bg-slate-50/30">
                              <FileText className="w-8 h-8 opacity-20 mx-auto mb-3"/>
                              <span className="font-semibold text-sm">Chưa có phiếu nào trong tháng.</span>
                            </TableCell>
                          </TableRow>
                        ) : 
                          sortedLogs.map(log => {
                            const totalAmount = calculateBillTotal(log.items);
                            return (
                              <TableRow key={log._id} className={`hover:bg-slate-50 border-b-slate-100 transition-colors ${editId === log._id ? 'bg-amber-50/50' : ''}`}>
                                <TableCell className="p-3 text-[11px] font-bold text-slate-600">
                                  <div>{log.date.split('-')[2]}/{log.date.split('-')[1]}</div>
                                  {log.createdAt && (
                                    <div className="text-[9px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                                      {new Date(log.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="p-3 text-center">
                                  {log.type === "UNPOSTED" 
                                    ? <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 shadow-none text-[9px] w-full justify-center">HỦY MÓN</Badge>
                                    : <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none text-[9px] w-full justify-center">ĐÃ POST</Badge>
                                  }
                                </TableCell>
                                <TableCell className="p-3 text-[11px] text-slate-600 leading-relaxed max-w-[200px]">
                                  <div className="space-y-1">
                                    {log.items.map((it: any, idx: number) => (
                                      <div key={idx} className="flex items-start gap-1.5">
                                        <span className={`font-bold px-1.5 rounded text-[9px] ${log.type === "UNPOSTED" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{it.quantity}</span>
                                        <span className="truncate">{it.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="p-3 text-right font-bold text-slate-700">
                                  {formatVND(totalAmount)}
                                </TableCell>
                                <TableCell className="p-3 text-center">
                                  <div className="flex gap-1.5 justify-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(log)} className="w-7 h-7 bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-xs border border-blue-100"><Edit3 className="w-3.5 h-3.5"/></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(log._id)} className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 shadow-xs border border-red-100"><Trash2 className="w-3.5 h-3.5"/></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        }
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================= */}
          {/* TAB 2: THỐNG KÊ TỔNG HỢP (THEO THÁNG)     */}
          {/* ========================================= */}
          <TabsContent value="summary" className="m-0 pt-2">
            <Card className="shadow-xl border-0 ring-1 ring-slate-200 max-w-[1000px] mx-auto overflow-hidden rounded-2xl">
              <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                    <CheckSquare className="w-6 h-6 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-wider uppercase text-white drop-shadow-md">BÁO CÁO ĐỐI SOÁT HỦY/POST</h3>
                    <p className="text-[11px] text-indigo-200 font-medium uppercase tracking-widest mt-0.5 opacity-80">
                      Tháng {selectedMonth} (Chỉ hiện mặt hàng có số liệu)
                    </p>
                  </div>
                </div>
                <div className="md:text-right bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] block opacity-70 uppercase font-black tracking-widest text-indigo-200">TỔNG GIÁ TRỊ HỦY THỰC TẾ:</span>
                  <span className={`text-2xl font-black drop-shadow-lg tracking-tighter ${summaryData.totalLostValue >= 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {formatVND(summaryData.totalLostValue)}
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-0">
                {Object.keys(summaryData.groups).length === 0 ? (
                  <div className="text-center py-24 text-slate-400 bg-slate-50/50">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-500"/>
                    <span className="font-bold">Tháng này chưa ghi nhận món hủy nào.</span>
                  </div>
                ) : (
                  Object.entries(summaryData.groups).map(([catName, items], gIdx) => (
                    <div key={gIdx} className="mb-4">
                      <div className="bg-slate-100/80 px-5 py-2 font-black text-xs text-indigo-800 uppercase tracking-widest border-y border-slate-200">
                        {catName}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-slate-200">
                            <TableHead className="font-bold text-slate-500 uppercase text-[10px] py-3 pl-6 w-[280px]">Tên Món</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] py-3">Đơn Giá</TableHead>
                            <TableHead className="text-center font-bold text-rose-600 uppercase text-[10px] py-3 bg-rose-50/30">Tổng Hủy</TableHead>
                            <TableHead className="text-center font-bold text-emerald-600 uppercase text-[10px] py-3 bg-emerald-50/30">Đã Post</TableHead>
                            <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] py-3 pr-6">Trạng Thái (Hủy - Post)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, idx) => {
                            const remain = item.unpostedQty - item.postedQty;
                            return (
                              <TableRow key={idx} className="border-b border-slate-100 hover:bg-indigo-50/30">
                                <TableCell className="font-bold text-slate-700 text-xs pl-6 py-3">{item.name}</TableCell>
                                <TableCell className="text-right py-3 text-xs font-medium text-slate-500">{formatVND(item.price)}</TableCell>
                                <TableCell className="text-center py-3 font-black text-rose-600 text-sm bg-rose-50/10">{item.unpostedQty}</TableCell>
                                <TableCell className="text-center py-3 font-black text-emerald-600 text-sm bg-emerald-50/10">{item.postedQty}</TableCell>
                                <TableCell className="text-right py-3 pr-6">
                                  {remain > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] bg-rose-100 px-2 py-1 rounded">
                                      Thiếu {remain}
                                    </span>
                                  ) : remain < 0 ? (
                                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] bg-amber-100 px-2 py-1 rounded">
                                      Dư {Math.abs(remain)}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-100 px-2 py-1 rounded">
                                      <CheckSquare className="w-3 h-3"/> Khớp
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ========================================= */}
          {/* TAB 3: CHI TIẾT CÁC BILL                  */}
          {/* ========================================= */}
          <TabsContent value="bills" className="m-0 pt-2">
             <Card className="shadow-md border-0 ring-1 ring-slate-200 max-w-[1200px] mx-auto bg-white overflow-hidden rounded-xl">
               <div className="bg-emerald-50/80 px-5 py-4 text-xs font-black text-emerald-800 uppercase tracking-widest flex justify-between border-b border-emerald-100 items-center">
                  <span className="flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-600"/> DANH SÁCH BILL NHẬP LIỆU THÁNG {selectedMonth}</span>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")} className="h-7 text-[10px] bg-white border-emerald-200 text-emerald-700">
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        {sortOrder === "desc" ? "Mới nhất trước" : "Cũ nhất trước"}
                      </Button>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 font-bold">{logs.length} BILL</Badge>
                  </div>
               </div>
               <div className="w-full overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-emerald-50/30">
                       <TableRow className="border-b-emerald-100">
                         <TableHead className="w-[120px] p-4 text-[11px] font-bold uppercase text-emerald-700">Ngày / Giờ Tạo</TableHead>
                         <TableHead className="w-[120px] p-4 text-[11px] font-bold uppercase text-emerald-700 text-center">Phân Loại</TableHead>
                         <TableHead className="p-4 text-[11px] font-bold uppercase text-emerald-700 text-center">Tổng Số Món</TableHead>
                         <TableHead className="text-right p-4 text-[11px] font-bold uppercase text-emerald-700">Tổng Thành Tiền</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-slate-400 bg-slate-50/30">
                              <Receipt className="w-8 h-8 opacity-20 mx-auto mb-3"/>
                              <span className="font-semibold text-sm">Tháng này chưa có bill nào.</span>
                            </TableCell>
                          </TableRow>
                        ) :
                        sortedLogs.map(log => {
                          const billTotal = calculateBillTotal(log.items);
                          const billQty = calculateBillQty(log.items);

                          return (
                            <TableRow key={log._id} className="hover:bg-slate-50 border-b-slate-100">
                               <TableCell className="p-4 text-xs font-bold text-slate-700">
                                  <span>{log.date.split('-').reverse().join('/')}</span>
                                  {log.createdAt && (
                                    <span className="ml-2 text-[10px] text-slate-400 font-medium">
                                      {new Date(log.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  )}
                               </TableCell>
                               <TableCell className="p-4 text-center">
                                  {log.type === "UNPOSTED" 
                                    ? <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[10px]">HỦY MÓN</Badge>
                                    : <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]">ĐÃ POST</Badge>
                                  }
                               </TableCell>
                               <TableCell className="p-4 text-center font-bold text-slate-600">
                                  {billQty}
                               </TableCell>
                               <TableCell className="p-4 text-right font-black text-slate-800 text-sm">
                                  <span className={log.type === "UNPOSTED" ? "text-rose-600" : "text-emerald-600"}>
                                    {log.type === "POSTED" && "- "}
                                    {formatVND(billTotal)}
                                  </span>
                               </TableCell>
                            </TableRow>
                          )
                        })
                      }
                    </TableBody>
                 </Table>
               </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}