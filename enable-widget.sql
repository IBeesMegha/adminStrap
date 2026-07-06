-- Quick script to enable the widget
-- Run this if widget is not appearing

-- Check if widget settings exist
SELECT * FROM "WidgetSettings";

-- If no settings exist, create default settings
INSERT INTO "WidgetSettings" (
  "id",
  "title",
  "welcomeText",
  "primaryColor",
  "secondaryColor",
  "textColor",
  "bgColor",
  "position",
  "marginX",
  "marginY",
  "width",
  "height",
  "borderRadius",
  "showLogo",
  "logoUrl",
  "logoWidth",
  "showAvatar",
  "avatarUrl",
  "avatarStyle",
  "bubbleStyle",
  "fontSize",
  "headerBgColor",
  "headerTextColor",
  "userMsgBgColor",
  "userMsgTextColor",
  "botMsgBgColor",
  "botMsgTextColor",
  "inputBgColor",
  "inputBorderColor",
  "sendButtonColor",
  "sendIconColor",
  "customCss",
  "embedActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'AI Assistant',
  'Hi! How can I help you today?',
  '#2563eb',
  '#1e40af',
  '#1f2937',
  '#ffffff',
  'bottom-right',
  20,
  20,
  380,
  600,
  16,
  false,
  '',
  40,
  true,
  '',
  'rounded',
  'rounded',
  '14px',
  '#2563eb',
  '#ffffff',
  '#2563eb',
  '#ffffff',
  '#f3f4f6',
  '#1f2937',
  '#ffffff',
  '#e5e7eb',
  '#2563eb',
  '#ffffff',
  '',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- If settings exist but widget is disabled, enable it
UPDATE "WidgetSettings" 
SET "embedActive" = true, "updatedAt" = NOW()
WHERE "embedActive" = false;

-- Verify widget is enabled
SELECT "embedActive", "title", "welcomeText" FROM "WidgetSettings";
