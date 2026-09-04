const fs = require("fs");
const path = require("path");

const targetFile = path.resolve(
  __dirname,
  "../node_modules/react-native-css-interop/dist/runtime/native/render-component.js"
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");

  // Fix printUpgradeWarning to not crash when inspecting props with throwing getters (like React Navigation context)
  if (content.includes("for (const entry of Object.entries(value)) {")) {
    content = content.replace(
      /function printUpgradeWarning\(warning, originalProps\) \{[\s\S]*?function getDebugReplacer\(\)/m,
      `function printUpgradeWarning(warning, originalProps) {
    try {
        console.warn(\`CssInterop upgrade warning.\\n\\n\${warning}.\\n\\nThis warning was caused by a component with the props:\\n\${stringify(originalProps)}\\n\\nIf adding or removing sibling components caused this warning you should add a unique "key" prop to your components. https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key\\n\`);
    } catch {
        console.warn(\`CssInterop upgrade warning: \${warning}\`);
    }
}
function stringify(object) {
    try {
        const seen = new WeakSet();
        return JSON.stringify(object, function replace(_, value) {
            if (!(value !== null && typeof value === "object")) {
                return value;
            }
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
            const newValue = Array.isArray(value) ? [] : {};
            try {
                for (const key of Object.keys(value)) {
                    try {
                        newValue[key] = replace(key, value[key]);
                    } catch {
                        newValue[key] = "[Unreadable]";
                    }
                }
            } catch {
                return "[Unserializable]";
            }
            seen.delete(value);
            return newValue;
        }, 2);
    } catch {
        return "[Unserializable Object]";
    }
}
function getDebugReplacer()`
    );
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("[patch-css-interop] Successfully patched react-native-css-interop render-component.js");
  } else {
    console.log("[patch-css-interop] File already patched or pattern not found.");
  }
}
