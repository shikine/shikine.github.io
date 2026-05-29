// karasuletters newsletter — Google Apps Script
// デプロイ設定: ウェブアプリ → 全員がアクセス可能

var NOTIFY_EMAIL    = 'watanabeshikine@gmail.com';
var UNSUB_EMAIL     = 'watanabeshikine@gmail.com'; // 配信停止メールの受信先
var SHEET_NAME      = 'フォームの回答 1';
var UNSUB_LABEL     = 'karasuletters-unsubscribed'; // 処理済みラベル

// ===== ウェブアプリ エントリーポイント =====
function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'register') {
    return handleRegister(data.name, data.email);
  }

  if (data.action === 'checkEmail') {
    return respond({ duplicate: isDuplicate(data.email) });
  }

  return respond({ error: 'unknown action' });
}

function doGet(e) {
  return respond({ status: 'ok' });
}

// ===== 登録処理 =====
function handleRegister(name, email) {
  if (isDuplicate(email)) {
    return respond({ duplicate: true });
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow([new Date(), name, email]);

  // 管理者への通知メール
  MailApp.sendEmail({
    to:      NOTIFY_EMAIL,
    subject: '【karasuletters】新しい購読者が登録しました',
    body:    '新しい登録者がありました。\n\nお名前：' + name + '\nメール：' + email + '\n\n登録日時：' + new Date().toLocaleString('ja-JP')
  });

  // 購読者へのサンクスメール
  MailApp.sendEmail({
    to:      email,
    subject: '【karasuletters】購読登録ありがとうございます',
    body:    name + ' さま\n\nkarasuletters へようこそ。\n\n購読登録ありがとうございます。\n月に一度、舞台・美術・建築、日々のことをお届けします。\n\n次号をどうぞお楽しみに。\n\nwith love,\nShikine Watanabe\n—\n配信停止をご希望の方は ' + UNSUB_EMAIL + ' に空メールをお送りください。'
  });

  return respond({ ok: true });
}

// ===== 配信停止処理（時間トリガーで定期実行） =====
function processUnsubscribeEmails() {
  // 処理済みラベルを取得または作成
  var label = GmailApp.getUserLabelByName(UNSUB_LABEL);
  if (!label) label = GmailApp.createLabel(UNSUB_LABEL);

  // 未読メールを受信箱から検索
  var threads = GmailApp.search('is:unread in:inbox');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var lastMsg  = messages[messages.length - 1];
    var body     = lastMsg.getPlainBody().trim();
    var from     = lastMsg.getFrom();

    // 本文が空 or「配信停止」「unsubscribe」のみのメールを対象
    var isUnsubRequest = body === '' ||
      /^(配信停止|unsubscribe|停止|解除)$/i.test(body);

    if (!isUnsubRequest) return;

    // 送信者のメールアドレスを抽出
    var emailMatch = from.match(/<(.+?)>/) || [null, from];
    var senderEmail = emailMatch[1].trim().toLowerCase();

    // スプレッドシートから削除
    var removed = removeSubscriber(senderEmail);

    if (removed) {
      // 本人に解除完了メール
      MailApp.sendEmail({
        to:      senderEmail,
        subject: '【karasuletters】配信停止が完了しました',
        body:    'karasuletters の配信停止が完了しました。\n\nご登録のメールアドレス：' + senderEmail + '\n\nまたいつでも https://shikine.github.io/ からご登録いただけます。\n\nShikine Watanabe'
      });

      // 管理者に通知
      MailApp.sendEmail({
        to:      NOTIFY_EMAIL,
        subject: '【karasuletters】配信停止がありました',
        body:    '配信停止のリクエストを処理しました。\n\nメール：' + senderEmail + '\n\n日時：' + new Date().toLocaleString('ja-JP')
      });
    }

    // 処理済みラベルを付けてアーカイブ
    thread.addLabel(label);
    thread.markRead();
    thread.moveToArchive();
  });
}

// ===== スプレッドシートから購読者を削除 =====
function removeSubscriber(email) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var lower = email.toLowerCase();

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).toLowerCase() === lower) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ===== 時間トリガーのセットアップ（初回のみ手動実行） =====
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'processUnsubscribeEmails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('processUnsubscribeEmails')
    .timeBased()
    .everyHours(1)
    .create();
}

// ===== ユーティリティ =====
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
