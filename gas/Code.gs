// karasuletters — Google Apps Script (完全版)
// デプロイ設定: ウェブアプリ → 全員がアクセス可能

var NOTIFY_EMAIL = 'watanabeshikine@gmail.com';
var UNSUB_EMAIL  = 'watanabeshikine@gmail.com';
var SHEET_NAME   = 'フォームの回答 1';
var UNSUB_LABEL  = 'karasuletters-unsubscribed';
var DRAFT_FOLDER = 'karasuletters_drafts';

// ===== ウェブアプリ エントリーポイント =====
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;

  // actionなし + subject/html あり → 即時送信
  if (!action && data.subject && data.html) return handleSend(data.subject, data.html);

  if (action === 'register')          return handleRegister(data.name, data.email);
  if (action === 'checkEmail')        return respond({ duplicate: isDuplicate(data.email) });
  if (action === 'schedule')          return handleSchedule(data.subject, data.html, data.scheduledAt);
  if (action === 'getScheduleStatus') return handleGetSchedules();
  if (action === 'cancelSchedule')    return handleCancelSchedule(data.id);
  if (action === 'saveDraft')         return handleSaveDraft(data.data);
  if (action === 'listDrafts')        return handleListDrafts();
  if (action === 'loadDraft')         return handleLoadDraft(data.issue);
  if (action === 'deleteDraft')       return handleDeleteDraft(data.issue);

  return respond({ error: 'unknown action' });
}

function doGet(e) {
  return respond({ status: 'ok' });
}

// ===== 即時送信 =====
function handleSend(subject, html) {
  var subscribers = getSubscribers();
  subscribers.forEach(function(row) {
    var name  = row[1] || '';
    var email = row[2];
    if (!email) return;
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: html,
      name: 'karasuletters'
    });
  });
  return respond({ ok: true, sent: subscribers.length });
}

// ===== スケジュール送信 =====
function handleSchedule(subject, html, scheduledAt) {
  var props = PropertiesService.getScriptProperties();
  var id    = 'sched_' + new Date().getTime();
  props.setProperty(id, JSON.stringify({ subject: subject, html: html, scheduledAt: scheduledAt }));
  ensureScheduleTrigger();
  return respond({ ok: true, id: id });
}

function handleGetSchedules() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var list  = [];
  Object.keys(props).forEach(function(key) {
    if (key.indexOf('sched_') === 0) {
      try {
        var v = JSON.parse(props[key]);
        v.id  = key;
        list.push(v);
      } catch(e) {}
    }
  });
  return respond({ schedules: list });
}

function handleCancelSchedule(id) {
  PropertiesService.getScriptProperties().deleteProperty(id);
  return respond({ ok: true });
}

function checkAndSendScheduled() {
  var now   = new Date().getTime();
  var props = PropertiesService.getScriptProperties();
  var all   = props.getProperties();
  Object.keys(all).forEach(function(key) {
    if (key.indexOf('sched_') !== 0) return;
    try {
      var v = JSON.parse(all[key]);
      if (new Date(v.scheduledAt).getTime() <= now) {
        handleSend(v.subject, v.html);
        props.deleteProperty(key);
      }
    } catch(e) {}
  });
}

function ensureScheduleTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkAndSendScheduled') return;
  }
  ScriptApp.newTrigger('checkAndSendScheduled').timeBased().everyMinutes(10).create();
}

// ===== 下書き CRUD (Google Drive) =====
function getDraftFolder() {
  var folders = DriveApp.getFoldersByName(DRAFT_FOLDER);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRAFT_FOLDER);
}

function handleSaveDraft(data) {
  var folder = getDraftFolder();
  var issue  = data.issue;
  var files  = folder.getFilesByName(issue + '.json');
  var content = JSON.stringify(data);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(issue + '.json', content, MimeType.PLAIN_TEXT);
  }
  return respond({ ok: true });
}

function handleListDrafts() {
  var folder = getDraftFolder();
  var files  = folder.getFiles();
  var list   = [];
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().match(/\.json$/)) {
      try { list.push(JSON.parse(f.getBlob().getDataAsString())); } catch(e) {}
    }
  }
  return respond({ drafts: list });
}

function handleLoadDraft(issue) {
  var folder = getDraftFolder();
  var files  = folder.getFilesByName(issue + '.json');
  if (!files.hasNext()) return respond({ error: 'not found' });
  try {
    return respond({ data: JSON.parse(files.next().getBlob().getDataAsString()) });
  } catch(e) {
    return respond({ error: 'parse error' });
  }
}

function handleDeleteDraft(issue) {
  var folder = getDraftFolder();
  var files  = folder.getFilesByName(issue + '.json');
  if (files.hasNext()) files.next().setTrashed(true);
  return respond({ ok: true });
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
  var label = GmailApp.getUserLabelByName(UNSUB_LABEL);
  if (!label) label = GmailApp.createLabel(UNSUB_LABEL);

  var threads = GmailApp.search('is:unread in:inbox');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var lastMsg  = messages[messages.length - 1];
    var body     = lastMsg.getPlainBody().trim();
    var from     = lastMsg.getFrom();

    var isUnsubRequest = body === '' ||
      /^(配信停止|unsubscribe|停止|解除)$/i.test(body);

    if (!isUnsubRequest) return;

    var emailMatch  = from.match(/<(.+?)>/) || [null, from];
    var senderEmail = emailMatch[1].trim().toLowerCase();

    var removed = removeSubscriber(senderEmail);

    if (removed) {
      MailApp.sendEmail({
        to:      senderEmail,
        subject: '【karasuletters】配信停止が完了しました',
        body:    'karasuletters の配信停止が完了しました。\n\nご登録のメールアドレス：' + senderEmail + '\n\nまたいつでも https://shikine.github.io/ からご登録いただけます。\n\nShikine Watanabe'
      });

      MailApp.sendEmail({
        to:      NOTIFY_EMAIL,
        subject: '【karasuletters】配信停止がありました',
        body:    '配信停止のリクエストを処理しました。\n\nメール：' + senderEmail + '\n\n日時：' + new Date().toLocaleString('ja-JP')
      });
    }

    thread.addLabel(label);
    thread.markRead();
    thread.moveToArchive();
  });
}

// ===== 時間トリガーのセットアップ（初回のみ手動実行） =====
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    var fn = t.getHandlerFunction();
    if (fn === 'processUnsubscribeEmails' || fn === 'checkAndSendScheduled') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('processUnsubscribeEmails').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('checkAndSendScheduled').timeBased().everyMinutes(10).create();
}

// ===== ユーティリティ =====
function getSubscribers() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  return data.slice(1); // ヘッダー行を除く
}

function isDuplicate(email) {
  var lower = email.toLowerCase();
  var rows  = getSubscribers();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === lower) return true;
  }
  return false;
}

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

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
