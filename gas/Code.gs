// karasuletters newsletter — Google Apps Script
// Deploy as: ウェブアプリ → 全員がアクセス可能 → 新しいデプロイ
// スプレッドシートのシート名は「フォームの回答 1」（Googleフォームが自動生成したもの）

var NOTIFY_EMAIL = 'watanabeshikine@gmail.com';
var SHEET_NAME   = 'フォームの回答 1';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'register') {
    return handleRegister(data.name, data.email);
  }

  // 後方互換：旧 checkEmail アクション
  if (data.action === 'checkEmail') {
    return respond({ duplicate: isDuplicate(data.email) });
  }

  return respond({ error: 'unknown action' });
}

function handleRegister(name, email) {
  if (isDuplicate(email)) {
    return respond({ duplicate: true });
  }

  // スプレッドシートに追記
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow([new Date(), name, email]);

  // 管理者に通知メール送信
  MailApp.sendEmail({
    to:      NOTIFY_EMAIL,
    subject: '【karasuletters】新しい購読者が登録しました',
    body:    '新しい登録者がありました。\n\nお名前：' + name + '\nメール：' + email + '\n\n登録日時：' + new Date().toLocaleString('ja-JP')
  });

  return respond({ ok: true });
}

function isDuplicate(email) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var lower = email.toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === lower) return true;
  }
  return false;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return respond({ status: 'ok' });
}
