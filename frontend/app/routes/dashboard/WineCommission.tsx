import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, GlassWater, Search, Calendar, RefreshCcw, Minus, Plus, Trash2, User, FileText, Wine, Edit3, XCircle, CheckCircle2, PlusCircle, ArrowUpDown } from "lucide-react";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";

// ==========================================
// DATA RƯỢU TĨNH (FULL DANH SÁCH TỪ EXCEL)
// ==========================================
const wineData = [
  { id: "W1", name: "SKYY VODKA", price: 2800000 },
  { id: "W2", name: "HAKU", price: 2800000 },
  { id: "W3", name: "ABSOLUTE ELYX 1L", price: 4200000 },
  { id: "W4", name: "GREY GOOSE", price: 2800000 },
  { id: "W5", name: "KETEL ONE", price: 2800000 },
  { id: "W6", name: "TANQUERAY", price: 2800000 },
  { id: "W7", name: "ROKU", price: 2800000 },
  { id: "W8", name: "LONDON NO.3", price: 3000000 },
  { id: "W9", name: "HENDRICK'S", price: 2800000 },
  { id: "W10", name: "KINOBI KYOTO", price: 4200000 },
  { id: "W11", name: "KINGSTON 62 WHITE", price: 2800000 },
  { id: "W12", name: "KRAKEN", price: 2800000 },
  { id: "W13", name: "JOSE CUERVO TRADICTIONAL", price: 2800000 },
  { id: "W14", name: "1800 CRISTALINO", price: 3900000 },
  { id: "W15", name: "CLASE AZUL REPOSADO", price: 14700000 },
  { id: "W16", name: "PATRON X.O", price: 3600000 },
  { id: "W17", name: "DON JULIO 1942", price: 12900000 },
  { id: "W18", name: "DON JULIO BLANCO", price: 3000000 },
  { id: "W19", name: "BULLEIT", price: 2800000 },
  { id: "W20", name: "WILD TURKEY 8 YEAR", price: 2800000 },
  { id: "W21", name: "JACK DANIEL", price: 2800000 },
  { id: "W22", name: "MAKER'S MARK", price: 2800000 },
  { id: "W23", name: "MACALLAN 12 SHERRY CASK", price: 6300000 },
  { id: "W24", name: "MACALLAN 15 DOUBLE CASK", price: 9900000 },
  { id: "W25", name: "MACALLAN 18 DOUBLE CASK", price: 25000000 },
  { id: "W26", name: "THE GLENLIVET 12", price: 3100000 },
  { id: "W27", name: "THE GLENLIVET 15", price: 4700000 },
  { id: "W28", name: "THE GLENLIVET 18", price: 8600000 },
  { id: "W29", name: "THE GLENLIVET 21", price: 18800000 },
  { id: "W30", name: "THE GLENLIVET 25", price: 30800000 },
  { id: "W31", name: "GLENFIDDICH 15", price: 3900000 },
  { id: "W32", name: "GLENFIDDICH 18", price: 6200000 },
  { id: "W33", name: "BALVENIE 14", price: 6900000 },
  { id: "W34", name: "BALVENIE 21", price: 22000000 },
  { id: "W35", name: "SINGLETON 12", price: 3100000 },
  { id: "W36", name: "SINGLETON 15", price: 5000000 },
  { id: "W37", name: "LAPHROAIG 10", price: 3700000 },
  { id: "W38", name: "BOWMORE 12", price: 3000000 },
  { id: "W39", name: "BOWMORE 15", price: 5200000 },
  { id: "W40", name: "BOWMORE 18", price: 7900000 },
  { id: "W41", name: "CHIVAS MINUZARA", price: 3000000 },
  { id: "W42", name: "CHIVAS MINUZARA 18", price: 5300000 },
  { id: "W43", name: "CHIVAS REGAL 18 BLUE SIGNATURE", price: 4300000 },
  { id: "W44", name: "CHIVAS ROYAL SALUTE 21", price: 7300000 },
  { id: "W45", name: "CHIVAS REGAL 25", price: 13500000 },
  { id: "W46", name: "BALLANTINE 17", price: 3600000 },
  { id: "W47", name: "BALLANTINE 21", price: 5500000 },
  { id: "W48", name: "BALLANTINE 30", price: 16700000 },
  { id: "W49", name: "JOHNNIE WALKER BLUE LABEL", price: 11200000 },
  { id: "W50", name: "JOHNNIE WALKER DOUBLE BLACK", price: 2800000 },
  { id: "W51", name: "NAKED MALT", price: 2800000 },
  { id: "W52", name: "MATSUI MIZUNARA CASK", price: 7500000 },
  { id: "W53", name: "MATSUI KURAYOSHI 8YO", price: 7600000 },
  { id: "W54", name: "KAKUBIN SUNTORY", price: 2800000 },
  { id: "W55", name: "HIBIKI HARMONY", price: 9500000 },
  { id: "W56", name: "THE YAMAZAKI DISTILLERS RESERVE", price: 9200000 },
  { id: "W57", name: "THE HAKUSHU DISTILLERS RESERVE", price: 9500000 },
  { id: "W58", name: "HENNESSY VSOP", price: 3500000 },
  { id: "W59", name: "HENNESSY X.O", price: 9800000 },
  { id: "W60", name: "MARTELL CORDON BLEU", price: 9400000 },
  { id: "W61", name: "The Yamazaki 12", price: 11000000 },
  { id: "W62", name: "Chateau Palmer 2008, Margaux 3rd Grand Cru Classe, Merlot/ Cabernet Sauvignon", price: 29000000 },
  { id: "W63", name: "Chateau Clinet, Pomerol, Bordeaux Blend", price: 7700000 },
  { id: "W64", name: "Pauillac De Chateau Latour, Bordeaux Blend", price: 7900000 },
  { id: "W65", name: "Chateau Larcis Ducasse, St. Emilion 1st Grand Cru Classe, Bordeaux Blend", price: 7700000 },
  { id: "W66", name: "Chateau Malescot St Exupery, Margaux 3rd Grand Cru Classe, Bordeaux Blend", price: 6200000 },
  { id: "W67", name: "Chateau Rouget, Pomerol, Bordeaux Blend", price: 5700000 },
  { id: "W68", name: "Chateau Hyon la Fleur,Merlot / Cabernet Sauvignon", price: 4800000 },
  { id: "W69", name: "Chateau Prieure Lichine, Margaux 4th Grand Cru Classe, Bordeaux Blend", price: 5600000 },
  { id: "W70", name: "Chateau Mont Redon, Chateauneuf du Pape, Grenache / Syrah/ Mourvedre", price: 3800000 },
  { id: "W71", name: "Chateau Saint Andre, Montagne Saint Emilion, Merlot/ Cab Sauvignon", price: 2700000 },
  { id: "W72", name: "Louis Jadot, Cote de Beaune Villages, Pinot Noir", price: 2600000 },
  { id: "W73", name: "Ronan By Chateau Clinet,Merlot", price: 1400000 },
  { id: "W74", name: "Maison Castel, Merlot, Bordeaux", price: 1400000 },
  { id: "W75", name: "Opus One 2019, Cabernet Sauvignon", price: 25000000 },
  { id: "W76", name: "Cum Laude - Banfi Toscana, Italy", price: 2400000 },
  { id: "W77", name: "Castello Banfi, Brunello di Montalcino DOCG, Sangiovese,Italy", price: 4800000 },
  { id: "W78", name: "Masi Costasera, Amarone della Valpolicella Classico DOCG,Corvina/ Rondinella /Molinara,Italy", price: 4800000 },
  { id: "W79", name: "Alvaro Palacios, La Vendimia, Garnacha/ Tempranillo", price: 1400000 },
  { id: "W80", name: "Concha Y Toro, Gran Reserva, Carmenere", price: 1400000 },
  { id: "W81", name: "La Joya Gran Reserva Syrah", price: 1700000 },
  { id: "W82", name: "Trimbach, Gewurztraminer, Alsace", price: 2400000 },
  { id: "W83", name: "Guigal, Cotes du Rhone, Rhone Blend", price: 1700000 },
  { id: "W84", name: "Domaine Huet, Clos du Bourg \"Demi Sec\", Chenin Blanc", price: 4800000 },
  { id: "W85", name: "Henri Bourgeois, 'En Travertin', Pouilly Fume, Sauvignon Blanc", price: 1700000 },
  { id: "W86", name: "Olivier Leflaive, Meursault, Chardonany", price: 6700000 },
  { id: "W87", name: "Louis Jadot, Pouilly Fuisse, Chardonnay", price: 3000000 },
  { id: "W88", name: "Clay Creek Chardonnay", price: 1700000 },
  { id: "W89", name: "D' Arenberg, The Olive Grove, Chardonnay", price: 1700000 },
  { id: "W90", name: "Torres, Vina Esmeralda Semi Dry White, Gewurztraminer Moscato", price: 1400000 },
  { id: "W91", name: "Concha Y Toro, Marques De Casa Concha Chardonnay", price: 1700000 },
  { id: "W92", name: "Vidal Estate by Villa Maria, Sauvignon Blanc, Malborough Valley", price: 1400000 },
  { id: "W93", name: "Villa Maria, Private Bin Sauvignon, Marlborough, Sauvignon Blanc", price: 1400000 },
  { id: "W94", name: "Rimapere by Baron Edmond de Rothschild", price: 1900000 },
  { id: "W95", name: "Gunderloch, \"Fritz\" ,Riesling", price: 1400000 },
  { id: "W96", name: "Villa Garrel Rose, Cotes de Provence, Cinsault Grenache", price: 1400000 },
  { id: "W97", name: "Maison Castel Rose, IGP d'Oc", price: 1400000 },
  { id: "W98", name: "Miguel Torres, Santa Digna , Cabernet Sauvignon, Chile", price: 1400000 },
  { id: "W99", name: "Bottega, Millesimato Brut, Spumante Bianco,Veneto, Italy", price: 1400000 },
  { id: "W100", name: "CHAMPAGNE Delamotte, Brut,France", price: 3900000 },
  { id: "W101", name: "CHAMPAGNE J.M. Labruyere, Prologue, Grand Cru,France", price: 12200000 },
  { id: "W102", name: "CHAMPAGNE Taittinger, Brut Prestige Rose, France", price: 5100000 },
  { id: "W103", name: "CHAMPAGNE Taittinger, Prelude Grands Crus Brut, France", price: 6000000 },
  { id: "W104", name: "CHAMPAGNE G.H Mumm Grand Cordon", price: 3900000 },
  { id: "W105", name: "Comtes De CHAMPAGNE Grands Crus - Blanc de blanc", price: 19500000 },
  { id: "W106", name: "CHAMPAGNE Salon, Le Mesnil Blanc de Blancs, France", price: 52400000 },
  { id: "W107", name: "CHAMPAGNE Tribaut Schloesser 750ml, 12-15%", price: 3900000 },
  { id: "W108", name: "CHAMPAGNE Dom Perignon, Vintage Brut", price: 12000000 },
  { id: "W109", name: "SAKE Ozeki Hozonjo Karatamba 15% 300ml", price: 1100000 },
  { id: "W110", name: "SAKE Ozeki Hozonjo Karatamba 15% 720ml", price: 1400000 },
  { id: "W111", name: "SAKE Ozeki Hozonjo Karatamba 15% 1800ml", price: 2400000 },
  { id: "W112", name: "SAKE Ozeki Yamada Nishiki 14% 300ml", price: 1200000 },
  { id: "W113", name: "SAKE Ozeki Yamada Nishiki 14% 720ml", price: 1400000 },
  { id: "W114", name: "SAKE Ozeki Yamada Nishiki 14% 1800ml", price: 3000000 },
  { id: "W115", name: "SAKE Dassai 45 16% -300ml", price: 1200000 },
  { id: "W116", name: "SAKE Dassai 45 16% -720ml", price: 2400000 },
  { id: "W117", name: "SAKE Dassai 39 16% -300ml", price: 1700000 },
  { id: "W118", name: "SAKE Dassai 39 16% -720ml", price: 3000000 },
  { id: "W119", name: "SAKE Dassai 23 16% -720ml", price: 4700000 },
  { id: "W120", name: "SAKE Asashibori Shuppintyozousyu Honjozo 20% 900ml", price: 1700000 },
  { id: "W121", name: "SAKE Shochikubai Fushimizujitate Kyoto Junmai 13-14% 700ML", price: 1200000 },
  { id: "W122", name: "SAKE Shochikubai Fushimizujitate Kyoto Junmai 13-14% 1800ML", price: 2100000 },
  { id: "W123", name: "SAKE Gekkeikan Daiginjo 15% 300ml", price: 1100000 },
  { id: "W124", name: "SAKE Gekkeikan Daiginjo 15% 720ml", price: 1400000 },
  { id: "W125", name: "SAKE Gekkeikan Nigori 10,5% 300ml", price: 1100000 },
  { id: "W126", name: "SAKE Horin Junmai Daiginjo 16% 300ml", price: 1200000 },
  { id: "W127", name: "SAKE Horin Junmai Daiginjo 16% 720ml", price: 3500000 },
  { id: "W128", name: "SAKE Horin Junmai Daiginjo 16% 1,800ml", price: 4700000 },
  { id: "W129", name: "SAKE Gekkeikan Tokubetsu with Gold Foil 15% 1800ml", price: 3500000 },
  { id: "W130", name: "SAKE Gekkeikan Daiginjo Fukuro Shibori 16% - 17% 720ml (Limited)", price: 7900000 },
  { id: "W131", name: "SAKE Ozeki Barrel 15% 1800ml", price: 3700000 },
  { id: "W132", name: "SAKE Chotokusen Osakaya Chobei Daiginjo 15% 300ml", price: 1100000 },
  { id: "W133", name: "SAKE Chotokusen Osakaya Chobei Daiginjo 15% 720ml", price: 1900000 },
  { id: "W134", name: "SAKE Chotokusen Osakaya Chobei Daiginjo 15% 1800ml", price: 3000000 },
  { id: "W135", name: "SAKE Daiginjo Choju 16% 720ml", price: 7300000 },
  { id: "W136", name: "SAKE Snow aged Junmai Daiginjo 3 years Hakkaisan (Yukimuro)17% (720ml)", price: 3500000 },
  { id: "W137", name: "SAKE Shichiken Sparkling 11% (720ml)", price: 2400000 },
  { id: "W138", name: "SAKE Kagatobi Junmai Nigori Sparkling 720ml", price: 1700000 },
  { id: "W139", name: "SHOCHU KHOAI LANG KAIDO IWA NO AKA / 720 ML", price: 1400000 },
  { id: "W140", name: "Umeshu Kodawari Mi-Iri Nakata / 720ML / 12%", price: 1700000 },
  { id: "W141", name: "F,San Marzano,Puglia,Negroamaro 750ml", price: 2800000 },
  { id: "W142", name: "RƯỢU SAKE Kubota Senju Ginjo 15% 1800ml", price: 3300000 },
  { id: "W143", name: "SKYY VODKA GLS", price: 220000 },
  { id: "W144", name: "HAKU GLASS", price: 220000 },
  { id: "W145", name: "GREY GOOSE GLASS", price: 220000 },
  { id: "W146", name: "KETEL ONE GLASS", price: 220000 },
  { id: "W147", name: "TANQUERAY GLASS", price: 220000 },
  { id: "W148", name: "ROKU GLASS", price: 220000 },
  { id: "W149", name: "LONDON NO.3 GLASS", price: 250000 },
  { id: "W150", name: "HENDRICK'S GLASS", price: 230000 },
  { id: "W151", name: "KINOBI KYOTO GLASS", price: 360000 },
  { id: "W152", name: "KINGSTON 62 WHITE GLASS", price: 220000 },
  { id: "W153", name: "KRAKEN GLASS", price: 220000 },
  { id: "W154", name: "JOSE CUERVO TRADICTIONAL GLASS", price: 220000 },
  { id: "W155", name: "1800 CRISTALINO GLASS", price: 320000 },
  { id: "W156", name: "PATRON X.O GLASS", price: 290000 },
  { id: "W157", name: "DON JULIO BLANCO GLASS", price: 240000 },
  { id: "W158", name: "BULLEIT GLASS", price: 220000 },
  { id: "W159", name: "WILD TURKEY 8 YEAR GLASS", price: 220000 },
  { id: "W160", name: "JACK DANIEL GLASS", price: 220000 },
  { id: "W161", name: "MAKER'S MARK GLASS", price: 220000 },
  { id: "W162", name: "MACALLAN 12 SHERRY CASK GLASS", price: 540000 },
  { id: "W163", name: "MACALLAN 15 DOUBLE CASK GLASS", price: 960000 },
  { id: "W164", name: "Concha Y Toro, Gran Reserva, Carmenere GLASS", price: 290000 },
  { id: "W165", name: "THE GLENLIVET 12 GLASS", price: 270000 },
  { id: "W166", name: "THE GLENLIVET 15 GLASS", price: 400000 },
  { id: "W167", name: "GLENFIDDICH 15 GLASS", price: 340000 },
  { id: "W168", name: "BALVENIE 14 GLASS", price: 590000 },
  { id: "W169", name: "SINGLETON 12 GLASS", price: 270000 },
  { id: "W170", name: "LAPHROAIG 10 GLASS", price: 290000 },
  { id: "W171", name: "BOWMORE 12 GLASS", price: 260000 },
  { id: "W172", name: "BOWMORE 15 GLASS", price: 450000 },
  { id: "W173", name: "CHIVAS MINUZARA GLASS", price: 260000 },
  { id: "W174", name: "CHIVAS REGAL 18 BLUE SIGNATURE GLASS", price: 370000 },
  { id: "W175", name: "BALLANTINE 17 GLASS", price: 310000 },
  { id: "W176", name: "JOHNNIE WALKER DOUBLE BLACK GLASS", price: 220000 },
  { id: "W177", name: "NAKED MALT GLASS", price: 220000 },
  { id: "W178", name: "KAKUBIN SUNTORY GLASS", price: 220000 },
  { id: "W179", name: "Vidal Estate by Villa Maria, Sauvignon Blanc, Malborough Valley GLASS", price: 290000 },
  { id: "W182", name: "HENNESSY VSOP GLASS", price: 330000 },
  { id: "W184", name: "Rượu Glenlivet 18 GLASS", price: 750000 },
  { id: "W185", name: "Sake Dassai 23 - 1800ml", price: 8000000 },
  { id: "W186", name: "RƯỢU VODKA MARTINI GLASS", price: 250000 },
  { id: "W187", name: "RƯỢU BAILEYS GLASS", price: 220000 },
  { id: "W188A", name: "RƯỢU SAKE Kubota Senju Ginjo 15% 720ml", price: 2100000 },
  { id: "W188B", name: "Sake Kubota Junmai Daiginjo 300ml", price: 1100000 },
  { id: "W188C", name: "MACALLAN 18 DOUBLE CASK GLASS", price: 2200000 },
  { id: "W189", name: "RƯỢU Vang F Negroamaro", price: 2800000 },
];

export default function WineCommissionPage() {
  const [masterStaff, setMasterStaff] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // Trạng thái sắp xếp

  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffName, setStaffName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [billItems, setBillItems] = useState<any[]>([]);

  const [wineSearch, setWineSearch] = useState("");
  const [showWineDropdown, setShowWineDropdown] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, billsRes]: [any, any] = await Promise.all([
        fetchData("/staff"),
        fetchData(`/wine-commission?month=${selectedMonth}`)
      ]);
      setMasterStaff((staffRes.data || staffRes || []).filter((s: any) => s.department === "FOH"));
      setBills(billsRes.data || billsRes || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, [selectedMonth]);

  const currentCalculations = useMemo(() => {
    let total = 0; let hasVip = false;
    billItems.forEach(i => {
      total += (i.price * i.quantity);
      if (i.price >= 10000000) hasVip = true;
    });
    let comm = 0;
    if (hasVip) comm = total * 0.1;
    else {
      if (total >= 10000000) comm = 500000;
      else if (total >= 5000000) comm = 300000;
      else if (total >= 3000000) comm = 100000;
    }
    return { totalBill: total, commission: comm, hasVip };
  }, [billItems]);

  const formatVND = (num: number) => Math.round(num).toLocaleString("vi-VN") + "đ";

  // CÁCH CHỌN MỚI (Máy tính tiền POS): Bấm là thêm 1 chai
  const handleSelectWine = (wine: any) => {
    const existing = billItems.findIndex(i => i.wineId === wine.id);
    if (existing >= 0) {
      const newItems = [...billItems];
      newItems[existing].quantity += 1;
      setBillItems(newItems);
    } else {
      setBillItems([...billItems, { wineId: wine.id, wineName: wine.name, price: wine.price, quantity: 1 }]);
    }
    setWineSearch(""); 
    setShowWineDropdown(false);
  };

  // Điều chỉnh số lượng trực tiếp trên Bill
  const handleChangeItemQty = (index: number, delta: number) => {
    const newItems = [...billItems];
    newItems[index].quantity += delta;
    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }
    setBillItems(newItems);
  };

  const handleSaveBill = async () => {
    if (!staffName || billItems.length === 0) return alert("Thiếu tên nhân viên hoặc rượu!");
    const payload = { date, staffName, customerName, items: billItems };
    try {
      if (editId) await updateData(`/wine-commission/${editId}`, payload);
      else await postData("/wine-commission", payload);
      setEditId(null); setBillItems([]); setCustomerName(""); setStaffName("");
      loadData();
      alert("Đã lưu Bill!");
    } catch (e) { alert("Lỗi lưu Bill!"); }
  };

  const handleDeleteBill = async (id: string) => {
    if (window.confirm("Xóa bill này vĩnh viễn?")) {
      await deleteData(`/wine-commission/${id}`);
      loadData();
    }
  };

  const handleDeleteMonth = async () => {
    if (!window.confirm(`NGUY HIỂM: Bạn có chắc muốn xóa TOÀN BỘ bill của tháng ${selectedMonth}?`)) return;
    try {
      await deleteData(`/wine-commission/month/${selectedMonth}`);
      loadData();
      alert("Đã xóa toàn bộ bill trong tháng!");
    } catch (error) {
      alert("Lỗi khi xóa tháng!");
    }
  };

  const handleEditBillClick = (bill: any) => {
    setEditId(bill._id);
    setDate(bill.date);
    setStaffName(bill.staffName);
    setCustomerName(bill.customerName || "");
    const mappedItems = bill.items.map((i: any) => ({
      wineId: i.wineId, wineName: i.wineName, price: i.price, quantity: i.quantity
    }));
    setBillItems(mappedItems);
  };

  const resetForm = () => {
    setEditId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setStaffName("");
    setCustomerName("");
    setBillItems([]);
    setWineSearch("");
  };

  const staffSummary = useMemo(() => {
    const map: Record<string, { comm: number, bottles: number }> = {};
    bills.forEach(b => {
      if (!map[b.staffName]) map[b.staffName] = { comm: 0, bottles: 0 };
      map[b.staffName].comm += b.commissionEarned;
      map[b.staffName].bottles += b.items.reduce((acc: number, i: any) => acc + i.quantity, 0);
    });
    const list = Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .filter(i => i.comm > 0)
      .sort((a, b) => b.comm - a.comm);
    const totalAllComm = list.reduce((acc, cur) => acc + cur.comm, 0);
    return { list, totalAllComm };
  }, [bills]);

  // Logic Sắp xếp mảng Bill
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [bills, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  return (
    <div className="h-full overflow-auto bg-slate-50 p-2 sm:p-6 text-sm font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4 pb-10">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <GlassWater className="w-5 h-5"/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Hệ Thống Hoa Hồng Rượu</h1>
              <p className="text-xs text-slate-500 font-medium">Quản lý & Thống kê Commission FOH</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5 mt-5 sm:mt-0">
  
  <div className="relative bg-slate-100 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition w-48">
    
    <Calendar className="w-4 h-4 text-slate-500" />
    
    <span className="text-sm font-semibold text-blue-700">
      {selectedMonth
        ? `Tháng ${selectedMonth.split("-")[1]} / ${selectedMonth.split("-")[0]}`
        : "Chọn tháng"}
    </span>

    <input 
      type="month" 
      value={selectedMonth} 
      onChange={(e) => setSelectedMonth(e.target.value)} 
      className="absolute inset-0 opacity-0 cursor-pointer"
    />
    
  </div>

  <Button 
    variant="outline" 
    size="icon" 
    onClick={loadData} 
    className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
  >
    <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}/>
  </Button>

  <Button 
    variant="destructive" 
    size="sm" 
    onClick={handleDeleteMonth} 
    className="h-9 font-semibold shadow-sm"
  >
    <Trash2 className="w-4 h-4 mr-1.5"/> Xóa Tháng
  </Button>

</div>
        </div>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="mb-4 h-10 bg-white border border-slate-200 shadow-xs w-full sm:w-auto p-1 rounded-lg">
            <TabsTrigger value="manage" className="text-sm px-6 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-medium">
              Nhập Liệu & Lịch Sử
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-sm px-6 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all font-medium">
              Tổng Hợp Commission
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* ========================================= */}
              {/* CỘT TRÁI: FORM NHẬP BILL (POS STYLE)      */}
              {/* ========================================= */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <Card className={`shadow-md border-0 ring-1 ${editId ? 'ring-amber-400 bg-amber-50/10' : 'ring-slate-200 bg-white'} transition-all`}>
                  <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      {editId ? <><Edit3 className="w-4 h-4 text-amber-600"/> CẬP NHẬT BILL RƯỢU</> : <><PlusCircle className="w-4 h-4 text-blue-600"/> NHẬP BILL MỚI</>}
                    </CardTitle>
                    {editId && (
                      <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 px-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50">
                        <XCircle className="w-3 h-3 mr-1"/> Hủy sửa
                      </Button>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-4 space-y-5">
                    {/* Thông tin cơ bản */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày bán</label>
                          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 text-sm font-medium border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> Nhân viên FOH</label>
                          <SelectUI value={staffName} onValueChange={setStaffName}>
                            <SelectTrigger className="h-9 text-sm font-medium border-slate-300 focus:ring-blue-500/20">
                              <SelectValue placeholder="Chọn FOH..."/>
                            </SelectTrigger>
                            <SelectContent>
                              {masterStaff.map(s => <SelectItem key={s._id} value={s.name} className="font-medium">{s.name}</SelectItem>)}
                            </SelectContent>
                          </SelectUI>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3 h-3"/> Tên Khách Hàng <span className="normal-case font-normal text-slate-400 text-[10px]">(Không bắt buộc)</span></label>
                        <Input placeholder="Nhập tên khách hàng..." value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-9 text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500/20" />
                      </div>
                    </div>

                    {/* Tìm & Thêm Rượu (POS Autocomplete) */}
                    <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 space-y-2.5 relative">
                      <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Wine className="w-3.5 h-3.5"/> Chọn Rượu Của Khách
                      </label>
                      <div className="relative w-full shadow-sm rounded-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input 
                          placeholder="Gõ tên rượu (Bấm để thêm ngay vào bill)..." 
                          value={wineSearch} 
                          onFocus={() => setShowWineDropdown(true)} 
                          onBlur={() => setTimeout(() => setShowWineDropdown(false), 200)} 
                          onChange={e => setWineSearch(e.target.value)} 
                          className="h-10 pl-9 text-sm font-medium border-blue-200 bg-white focus:border-blue-500 focus:ring-blue-500/30 transition-all placeholder:text-slate-400" 
                        />
                        
                        {/* Dropdown Gợi ý */}
                        {showWineDropdown && (
                          <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-56 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
                            {wineData
                              .filter(w => w.name.toLowerCase().includes(wineSearch.toLowerCase()))
                              .map(w => (
                                <div 
                                  key={w.id} 
                                  onMouseDown={(e) => { e.preventDefault(); handleSelectWine(w); }} 
                                  className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center group transition-colors"
                                >
                                  <span className="font-semibold text-slate-700 group-hover:text-blue-700 text-xs">{w.name}</span>
                                  <Badge variant="secondary" className="bg-slate-100 text-blue-700 group-hover:bg-white border border-slate-200 group-hover:border-blue-200">
                                    {formatVND(w.price)}
                                  </Badge>
                                </div>
                            ))}
                            {wineData.filter(w => w.name.toLowerCase().includes(wineSearch.toLowerCase())).length === 0 && (
                              <div className="p-4 text-sm text-slate-400 text-center flex flex-col items-center gap-1">
                                <Search className="w-5 h-5 opacity-50"/>
                                Không tìm thấy rượu phù hợp
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Giỏ Hàng (Cart) */}
                      <div className="mt-3 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 flex justify-between border-b border-slate-100 uppercase tracking-widest">
                          <span>Sản phẩm</span>
                          <span className="w-24 text-center">Số lượng</span>
                        </div>
                        
                        <div className="p-1.5 flex-1 min-h-[120px] max-h-[220px] overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                          {billItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6 gap-2">
                              <GlassWater className="w-6 h-6 opacity-40"/>
                              <p className="text-xs font-medium">Chưa có rượu trong Bill</p>
                              <p className="text-[10px] text-slate-500">Hãy tìm và chọn rượu phía trên</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-1">
                              {billItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg shadow-xs border border-slate-200 group hover:border-blue-300 transition-colors">
                                  <div className="flex-1 flex flex-col justify-center overflow-hidden pr-3">
                                    <span className="font-bold text-slate-700 truncate" title={item.wineName}>{item.wineName}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">x {formatVND(item.price)}</span>
                                  </div>
                                  
                                  {/* Bộ đếm POS xịn */}
                                  <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200 shadow-inner group-hover:bg-white group-hover:border-blue-200 transition-colors">
                                    <button 
                                      onClick={() => handleChangeItemQty(idx, -1)} 
                                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all text-slate-600"
                                    >
                                      <Minus className="w-3 h-3 stroke-[3]"/>
                                    </button>
                                    <span className="w-7 text-center font-bold text-slate-700">{item.quantity}</span>
                                    <button 
                                      onClick={() => handleChangeItemQty(idx, 1)} 
                                      className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm border border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 active:scale-95 transition-all text-slate-600"
                                    >
                                      <Plus className="w-3 h-3 stroke-[3]"/>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TỔNG KẾT FORM (Khối màu sắc) */}
                    <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-lg border border-indigo-800">
                      <div className="flex justify-between text-xs opacity-80 mb-2 border-b border-indigo-800/50 pb-2">
                        <span className="font-medium tracking-wide uppercase">Tổng Tiền Rượu:</span>
                        <span className="font-bold">{formatVND(currentCalculations.totalBill)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-200">HOA HỒNG NHẬN:</span>
                          {currentCalculations.hasVip && (
                            <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-1 mt-1 bg-yellow-400/10 px-1.5 py-0.5 rounded-sm border border-yellow-400/20">
                              ⚡ Mốc VIP 10%
                            </span>
                          )}
                        </div>
                        <span className="text-3xl font-black text-amber-400 drop-shadow-md tracking-tight">
                          {formatVND(currentCalculations.commission)}
                        </span>
                      </div>
                    </div>

                    <Button onClick={handleSaveBill} className="w-full bg-green-600 hover:bg-green-500 h-11 font-black text-sm uppercase tracking-widest shadow-md hover:shadow-lg transition-all rounded-lg">
                      <Save className="w-4 h-4 mr-2 stroke-[3]"/> {editId ? "LƯU CẬP NHẬT BILL" : "LƯU VÀO HỆ THỐNG"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* ========================================= */}
              {/* CỘT PHẢI: LỊCH SỬ CHI TIẾT                */}
              {/* ========================================= */}
              <div className="lg:col-span-8 flex flex-col">
                <Card className="shadow-md border-0 ring-1 ring-slate-200 bg-white overflow-hidden rounded-xl">
                  <div className="bg-slate-50/80 px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-widest flex justify-between border-b border-slate-100 items-center">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500"/> LỊCH SỬ THÁNG {selectedMonth}</span>
                    <Badge variant="outline" className="bg-white border-slate-200 font-bold">{bills.length} BILL ĐÃ NHẬP</Badge>
                  </div>
                  
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 shadow-xs">
                        <TableRow className="border-b-slate-200">
                          {/* Tiêu đề Ngày có thể click để sắp xếp */}
                          <TableHead 
                            className="w-[90px] p-3 text-[10px] font-bold uppercase text-slate-500 cursor-pointer hover:bg-slate-200 transition-colors"
                            onClick={toggleSortOrder}
                          >
                            <div className="flex items-center gap-1">
                              Ngày <ArrowUpDown className="w-3 h-3"/>
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px] p-3 text-[10px] font-bold uppercase text-slate-500">FOH</TableHead>
                          <TableHead className="p-3 text-[10px] font-bold uppercase text-slate-500">Chi tiết rượu & Khách</TableHead>
                          <TableHead className="text-right p-3 text-[10px] font-bold uppercase text-slate-500">Tổng Bill</TableHead>
                          <TableHead className="text-right font-black text-blue-700 p-3 text-[10px] uppercase bg-blue-50/50">Hoa Hồng</TableHead>
                          <TableHead className="text-center w-[80px] p-3 text-[10px] font-bold uppercase text-slate-500">Sửa/Xóa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedBills.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-slate-400 bg-slate-50/30">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="w-8 h-8 opacity-20"/>
                                <span className="font-semibold text-sm">Tháng này chưa có dữ liệu.</span>
                                <span className="text-xs opacity-70">Hãy nhập bill mới ở form bên trái.</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : 
                          sortedBills.map(b => (
                            <TableRow key={b._id} className={`hover:bg-slate-50 group border-b-slate-100 transition-colors ${editId === b._id ? 'bg-amber-50/50 hover:bg-amber-50' : ''}`}>
                              <TableCell className="p-3 text-[11px] font-medium text-slate-600">{b.date.split('-')[2]}/{b.date.split('-')[1]}</TableCell>
                              <TableCell className="p-3 font-bold text-blue-700 text-xs">
                                <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-blue-300"/> {b.staffName}</div>
                              </TableCell>
                              <TableCell className="p-3 text-[11px] text-slate-600 leading-relaxed max-w-[250px]">
                                <div className="space-y-1">
                                  {b.items.map((it: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-1">
                                      <span className="font-bold text-slate-700 bg-slate-100 px-1 rounded text-[9px]">{it.quantity}</span>
                                      <span className="truncate">{it.wineName}</span>
                                    </div>
                                  ))}
                                  {b.customerName && (
                                    <div className="text-blue-500 font-medium text-[10px] mt-1 flex items-center gap-1 bg-blue-50 w-fit px-1.5 rounded-sm">
                                      KH: {b.customerName}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="p-3 text-right font-semibold text-slate-700 text-xs">{formatVND(b.totalBillAmount)}</TableCell>
                              <TableCell className="p-3 text-right font-black text-emerald-600 text-[13px] bg-blue-50/10">
                                {formatVND(b.commissionEarned)}
                                {b.isVipRuleApplied && <Badge className="ml-1.5 h-4 text-[8px] bg-red-500/90 text-white border-0 shadow-xs rounded-sm hover:bg-red-500">VIP</Badge>}
                              </TableCell>
                              <TableCell className="p-3 text-center">
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all justify-center">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditBillClick(b)} className="w-7 h-7 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-xs border border-blue-100"><Edit3 className="w-3.5 h-3.5"/></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBill(b._id)} className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 shadow-xs border border-red-100"><Trash2 className="w-3.5 h-3.5"/></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================================= */}
          {/* TAB 2: TỔNG HỢP COMMISSION                */}
          {/* ========================================= */}
          <TabsContent value="summary" className="m-0 pt-2">
            <Card className="shadow-xl border-0 ring-1 ring-slate-200 max-w-[900px] mx-auto overflow-hidden rounded-2xl">
              <div className="p-5 bg-linear-to-r from-blue-900 to-indigo-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                    <CheckCircle2 className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-wider uppercase text-white drop-shadow-md">TỔNG HỢP HOA HỒNG</h3>
                    <p className="text-[11px] text-blue-200 font-medium uppercase tracking-widest mt-0.5 opacity-80">
                      Báo Cáo Tháng {selectedMonth}
                    </p>
                  </div>
                </div>
                
                <div className="md:text-right bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] block opacity-70 uppercase font-black tracking-widest text-indigo-200">TỔNG CHI THƯỞNG THÁNG NÀY:</span>
                  <span className="text-3xl font-black text-amber-400 drop-shadow-lg tracking-tighter">
                    {formatVND(staffSummary.totalAllComm)}
                  </span>
                </div>
              </div>
              
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-xs py-4 pl-6">Thành Viên FOH</TableHead>
                    <TableHead className="text-center font-black text-slate-500 uppercase tracking-widest text-xs py-4">Tổng Chai Đã Bán</TableHead>
                    <TableHead className="text-right font-black text-blue-700 uppercase tracking-widest text-xs py-4 pr-6">Hoa Hồng Nhận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffSummary.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-24 text-slate-400 bg-slate-50/50">
                        <Wine className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                        <span className="font-bold">Không có nhân sự nào nhận hoa hồng tháng này.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffSummary.list.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50/50 border-b border-slate-100 transition-colors">
                        <TableCell className="font-bold text-slate-800 text-sm pl-6 py-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black border border-blue-200">
                            {item.name.charAt(0)}
                          </div>
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Badge variant="secondary" className="font-bold text-xs bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 shadow-xs">
                            {item.bottles} chai
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600 text-lg pr-6 py-4">
                          {formatVND(item.comm)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="bg-slate-50 p-4 border-t border-slate-200 text-center font-medium text-slate-400 text-xs">
                Hệ thống chỉ hiển thị những nhân viên FOH có phát sinh hoa hồng.
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}