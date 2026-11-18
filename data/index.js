/* Bộ nạp dữ liệu — chạy sau tất cả file data, trước game.js */
window.PN_DATA_SNAPSHOT = true;
(function () {
  'use strict';
  const D = window.PN_DATA = window.PN_DATA || {};
  D.roll = D.roll || {};
  if (Array.isArray(D.linhCan)) D.roll.linhCan = D.linhCan;
  if (Array.isArray(D.theChat)) D.roll.theChat = D.theChat;
  if (Array.isArray(D.xuatThan)) D.roll.xuatThan = D.xuatThan;
  ['canhGioi','linhCan','theChat','xuatThan','vungDat','tongMon','biCanh','congPhap','vatPham','danPhuong','npcs','npcMau','yeuThu','suKienOffline'].forEach(k => {
    if (!Array.isArray(D[k])) D[k] = [];
  });
})();
