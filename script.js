let codeError = false;
let canvasEle;
let drawOverride = false;

const triggerDebounce = 100;
const triggerEndDebounce = 50;
let triggerTimestamp = 0;
let varContainer = {};

let busy = false;
let codeEdited = false;

let bgc = "#141414";
let effectControlValues = Object.freeze({});
let normalizedControlSchema = {};

let apiKey = "";
let gptModel = "gpt-5.6-luna";
let maxTokens = 5000;
let temperature = 0.5;
let reasoningLevel = "medium";
let effectCode = ``;

let effectPrompt = ``;

let codeInstructions = ``;

let prePrompt = `The following is a description of an animation effect triggered by mouse or touch interactions. 
Please write step by step instructions on how to create it in the p5.js scripting language.
Write instructions for how to draw a single animation effect instance, do not write instructions for how to draw multiple instances, or how to setup the drawing environment.
Avoid stating specific syntax or code, instead describe the steps in plain english.
Please keep the instructions concise and to the point.
Do not include any explanation or other details.
Format the response as a bulleted list with - characters.
Return only the step by step instructions without any further elaboration before or after.`;

let systemPrompt = `You are a creative coder and VFX artist skilled in p5.js. Produce a JavaScript object for an animation effect triggered by mouse or touch interactions.

Output:
- Only return a JavaScript object literal { ... }.
- No let/const/var/function/export, no code fences, no extra text.
- Include comments in newlines to explain the code at every step in simple terms, easily understandable by a child of 7-12 years old. Do not append comments to existing lines of code.
- Include a preamble in one line as a comment at the top that explains the overall structure of the programme in a pseudocode style (using newlines as line breaks) and how it works but do not label it as a preamble.

Required properties/methods (must always exist):
- triggered: number → millis() timestamp, default -1000000.
- duration: number → animation lifetime (ms).
- controlSchema: object → 3-6 meaningful visual controls when the effect has adjustable visuals, otherwise {}.
- trigger(objects, x, y, controls): called on mousePressed. Updates triggered. Saves x, y position of instance if required.
- update(objects, controls): runs before display(). Updates self from objects except this, may reference shared data if defined.
- display(objects, controls): called in draw(). Renders effect with p5.js functions.

Control schema:
- Each key must be a unique JavaScript identifier and maps to one control definition.
- Supported definitions:
  - range: { type: "range", label, default, min, max, step }
  - color: { type: "color", label, default } where default is a 6-digit hex color.
  - checkbox: { type: "checkbox", label, default } where default is boolean.
  - select: { type: "select", label, default, options } where options is an array of strings.
- Expose only meaningful visual choices, not lifecycle or internal state such as triggered, duration, positions, velocities, counters, or loop indexes.
- Read adjustable values from the controls argument. Values are live and must affect visible and future instances immediately.
- Do not mutate controls or controlSchema inside the effect.
- Use the Effect Description to infer which visual properties the user is most likely to want to adjust. 
Prioritize controlSchema entries that correspond to explicitly mentioned qualities such as color, size, speed, quantity, shape, intensity, spread, and animation duration.
- Note: Do not pass a hex color and alpha as two arguments to fill() or stroke(). For transparency, create a p5.Color with color(hexValue), call setAlpha(alpha), then pass that p5.Color to fill() or stroke().
Effect-specific properties/methods (preferred location):
- Store all other state and helper functions directly in the object (e.g. position, velocity, colors, easing functions).
- Keep them unique and self-contained to avoid conflicts.
- Use "this." when referencing properties/methods inside the object.

Globals (varContainer):
- Use a property in the varContainer object to keep track of trigger count.
- Use only for values shared across all objects (e.g. counters, lookup tables, or global helpers).
- Always check existence before init: if (!("triggerCounter" in varContainer)) varContainer.triggerCounter = 0;
- If background graphics are required, use varContainer to store them and check that if it exists before instantiating. If it exists, do not create a new copy. Only draw background for the first object in the array of objects.

Rules:
- Explicitly call colorMode(...) before using colors.
- Keep helpers inside the object unless truly global.
- Use unique names that don’t conflict with p5.js.
- Comments: minimal and inline only.

Return only the object.`;

let refineCodePrompt = `Modify the following JavaScript object based on the proposed refinements for an animation effect triggered by mouse or touch interactions.

Rules:
- Only return a JavaScript object literal { ... }.
- No let/const/var/function/export, no code fences, no extra text.
- Do not change anything else except as specified in the refinements.
- Keep the object structure, properties/methods and comments intact as far as possible.
- Replace the commented preamble explaining instead the key changes made and the new pseudocode of the programme (using newlines as line breaks) and how it works but do not label it as a preamble or pseudocode..

Required properties/methods (must always exist):
- triggered: number → millis() timestamp, default -1000000.
- duration: number → animation lifetime (ms).
- controlSchema: object → preserve existing controls and keep them synchronized with the refined code. Add controls for newly adjustable visual values when appropriate.
- trigger(objects, x, y, controls): called on mousePressed. Updates triggered. Saves x, y position of instance if required.
- update(objects, controls): runs before display(). Updates self from objects except this, may reference shared data if defined.
- display(objects, controls): called in draw(). Renders effect with p5.js functions.

Control schema:
- Supported types are range, color, checkbox, and select.
- range requires label, default, min, max, and step.
- color requires a 6-digit hex default; checkbox requires a boolean default.
- select requires a string default and an array of string options containing that default.
- Read adjustable values from the controls argument so changes affect visible and future instances immediately.
- Never expose lifecycle or internal state, and never mutate controls or controlSchema.
- Note: Do not pass a hex color and alpha as two arguments to fill() or stroke(). For transparency, create a p5.Color with color(hexValue), call setAlpha(alpha), then pass that p5.Color to fill() or stroke().

Effect-specific properties/methods (preferred location):
- Store all other state and helper functions directly in the object (e.g. position, velocity, colors, easing functions).
- Keep them unique and self-contained to avoid conflicts.
- Use "this." when referencing properties/methods inside the object.

Globals (varContainer) (last resort):
- Use only for values shared across all objects (e.g. counters, lookup tables, or global helpers).
- Never store object-specific data here.
- Always check existence before init: if (!("triggerCounter" in varContainer)) varContainer.triggerCounter = 0;
- If background graphics are required, use varContainer to store them and check that if it exists before instantiating. If it exists, do not create a new copy. Only draw background for the first object in the array of objects.
`;

let refineCode = ``;

let codeEditor;
let history;

function selectColorSwatch(color) {
  document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
  const swatch = document.querySelector(`.color-swatch[data-color="${color}"]`);
  if (swatch) {
    swatch.classList.add("selected");
  }
}

function setup() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  canvasEle = createCanvas(windowWidth, windowHeight);
  canvasEle.parent("#canvas-container");

  codeEditor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "javascript",
    theme: "mdn-like",
    lineNumbers: true,
    lineWrapping: true
  });
  codeEditor.setSize("100%", "100vh");

  if (localStorage.getItem("backgroundColor")) {
    bgc = localStorage.getItem("backgroundColor");
    selectColorSwatch(bgc);
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("apiKey")) {
    apiKey = params.get("apiKey");
    document.querySelector("#api-key").value = apiKey;
    localStorage.setItem("apiKey", apiKey);
    window.location.search = "";
  } else if (localStorage.getItem("apiKey")) {
    apiKey = localStorage.getItem("apiKey");
    document.querySelector("#api-key").value = apiKey;
  }

  if (localStorage.getItem("effectPrompt")) {
    effectPrompt = localStorage.getItem("effectPrompt");
    document.querySelector("#idea-prompt").value = effectPrompt;
  }
  if (localStorage.getItem("codeInstructions")) {
    codeInstructions = localStorage.getItem("codeInstructions");
    document.querySelector("#instructions-prompt").value = codeInstructions;
  }
  if (localStorage.getItem("effectCode")) {
    effectCode = localStorage.getItem("effectCode");
    codeEditor.setValue(effectCode);
    evaluateEffectCode({ preserveControls: false });
  }

  if (localStorage.getItem("spells")) {
    const savedSpells = JSON.parse(localStorage.getItem("spells"));
    // Keep example spells and add user-created spells
    const userSpells = savedSpells.filter(s => s.type !== "example");
    spells = [...spells, ...userSpells];
  }

  refreshHistory();
  updateSpells();

  document.querySelector("#tab-idea").addEventListener("click", (e) => {
    document.querySelector("#tab-idea").classList.add("active");
    document.querySelector("#tab-instructions").classList.remove("active");
    document.querySelector("#tab-effect").classList.remove("active");
    document.querySelector("#idea-container").classList.add("active");
    document.querySelector("#instructions-container").classList.remove("active");
    document.querySelector("#effect-container").classList.remove("active");
  });

  document.querySelector("#tab-instructions").addEventListener("click", (e) => {
    document.querySelector("#tab-idea").classList.remove("active");
    document.querySelector("#tab-instructions").classList.add("active");
    document.querySelector("#tab-effect").classList.remove("active");
    document.querySelector("#idea-container").classList.remove("active");
    document.querySelector("#instructions-container").classList.add("active");
    document.querySelector("#effect-container").classList.remove("active");
  });

  document.querySelector("#tab-effect").addEventListener("click", (e) => {
    document.querySelector("#tab-idea").classList.remove("active");
    document.querySelector("#tab-instructions").classList.remove("active");
    document.querySelector("#tab-effect").classList.add("active");
    document.querySelector("#idea-container").classList.remove("active");
    document.querySelector("#instructions-container").classList.remove("active");
    document.querySelector("#effect-container").classList.add("active");
  });

  document.querySelector("#spellbook-btn").addEventListener("click", (e) => {
    document.querySelector("#spellbook-container").classList.add("active");
    document.querySelector("#spellbook-container").scrollTo(0, 0);
  });

  document.querySelector("#settings-btn").addEventListener("click", (e) => {
    document.querySelector("#settings-container").classList.add("active");
  });

  document.querySelector("#history-btn").addEventListener("click", (e) => {
    document.querySelector("#history-container").classList.add("active");
  });

  document.querySelectorAll(".close-btn").forEach((e) => {
    e.addEventListener("click", (e) => {
      document.querySelector("#history-container").classList.remove("active");
      document.querySelector("#settings-container").classList.remove("active");
      document.querySelector("#spellbook-container").classList.remove("active");
    });
  });

  document.querySelector("#play-btn").addEventListener("click", (e) => {
    if (codeEditor.getValue().length > 0) {
      checkEffect();
      if (!codeError) {
        document.querySelector("#editor-container").classList.remove("active");
        document.querySelector("#canvas-container").classList.add("active");
      } else {
        alert("Please fix the code errors first");
      }
    } else {
      alert("Please generate code first");
    }
  });

  document.querySelector("#edit-btn").addEventListener("click", (e) => {
    document.querySelector("#editor-container").classList.add("active");
    document.querySelector("#canvas-container").classList.remove("active");
    closeEffectControls(false);
  });

  document.querySelector("#controls-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const panel = document.querySelector("#effect-controls-panel");
    const isOpen = panel.classList.toggle("active");
    panel.inert = !isOpen;
    panel.setAttribute("aria-hidden", String(!isOpen));
    document.querySelector("#controls-btn").setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      const firstControl = panel.querySelector("#effect-controls input, #effect-controls select");
      (firstControl || document.querySelector("#close-controls-btn")).focus({ preventScroll: true });
    }
  });

  document.querySelector("#close-controls-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    closeEffectControls();
  });

  document.querySelector("#effect-controls-panel").addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });

  document.querySelector("#effect-controls-panel").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEffectControls();
    }
  });

  document.querySelector("#save-btn").addEventListener("click", (e) => {
    if (codeEditor.getValue().length === 0 || effectPrompt.length === 0 || codeInstructions.length === 0) {
      alert("Effect information is missing, please fill in all steps before saving.");
    } else if (codeError) {
      alert("Code contains errors, please fix before saving.");
    } else {
      document.querySelector("#save-spell-modal-wrapper").classList.add("active");
    }
  });

  document.querySelector("#save-spell-btn").addEventListener("click", (e) => {
    if (document.querySelector("#spell-name").value.length === 0) {
      alert("Please enter a name for the spell");
    } else {
      saveSpell();
    }
  });

  document.querySelector("#cancel-save-spell-btn").addEventListener("click", (e) => {
    document.querySelector("#save-spell-modal-wrapper").classList.remove("active");
  });

  document.querySelector("#export-spellbook").addEventListener("click", (e) => {
    const spellsJson = JSON.stringify(spells);
    console.log(spellsJson);
    const blob = new Blob([spellsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hocuspocus_spellbook.json`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    console.log("exporting spellbook");
  });

  document.querySelector("#import-spellbook").addEventListener("click", (e) => {
    const _input = document.createElement("input");
    _input.type = "file";
    _input.accept = ".json";
    _input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const spellsJson = e.target.result;
          const spellsTemp = JSON.parse(spellsJson);
          const spellsToTransfer = [];
          if (Array.isArray(spellsTemp)) {
            spellsTemp.forEach((s) => {
              let check = true;
              if (!s.name || !s.timestamp || !s.type || !s.idea || !s.instructions || !s.code || !s.thumbnail) {
                check = false;
              }
              if (s.type !== "example" && s.type !== "user") {
                check = false;
              }
              if ("controlValues" in s && !isPlainObject(s.controlValues)) {
                check = false;
              }
              if (s.type === "example") {
                s.type = "user";
              }
              if (check) {
                if (spells.find((i) => i.timestamp === s.timestamp && i.name === s.name)) {
                  console.log("duplicate spell found");
                } else {
                  spellsToTransfer.push(s);
                }
              }
            });
          }
          console.log(spellsToTransfer);
          spells.push(...spellsToTransfer);
          localStorage.setItem("spells", JSON.stringify(spells));
          updateSpells();
        }
        reader.readAsText(file);
        _input.remove();
      }
    }
    _input.click();
    console.log("importing spellbook");
  });

  document.querySelector("#export-history").addEventListener("click", () => {
    const historyJson = JSON.stringify(history);
    console.log(historyJson);
    const blob = new Blob([historyJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hocuspocus_history.json`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    console.log("exporting history");
  });

  document.querySelector("#import-history").addEventListener("click", () => {
    const _input = document.createElement("input");
    _input.type = "file";
    _input.accept = ".json";
    _input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const historyJson = e.target.result;
          const historyTemp = JSON.parse(historyJson);
          if (Array.isArray(historyTemp)) {
            let check = true;
            historyTemp.forEach((h) => {
              if (!h.timestamp || !h.prompt || !h.code || !h.instructions) {
                check = false;
              }
            });

            if (check) {
              history.push(...historyTemp);
              localStorage.setItem("history", JSON.stringify(history));
              refreshHistory();
            } else {
              alert("Invalid history file");
            }
          }
        };
        reader.readAsText(file);
        _input.remove();
      }
    };
    _input.click();
    console.log("importing history");
  });

  document.querySelector("#api-key").addEventListener("change", (e) => {
    apiKey = e.target.value;
    localStorage.setItem("apiKey", apiKey);
  });

  document.querySelectorAll(".color-swatch").forEach(swatch => {
    swatch.addEventListener("click", (e) => {
      bgc = e.target.dataset.color;
      localStorage.setItem("backgroundColor", bgc);

      document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
      e.target.classList.add("selected");
    });
  });

  document.querySelector("#idea-prompt").addEventListener("change", (e) => {
    console.log("code change");
    effectPrompt = e.target.value;
    localStorage.setItem("effectPrompt", effectPrompt);
  });

  document.querySelector("#instructions-prompt").addEventListener("change", (e) => {
    console.log("instructions change");
    codeInstructions = e.target.value;
    localStorage.setItem("codeInstructions", codeInstructions);
  });

  codeEditor.on("change", (cm, changeObject) => {
    codeEdited = true;
  });

  codeEditor.on("blur", (e) => {
    if (codeEdited) {
      console.log("code change");
      effectCode = codeEditor.getValue();
      evaluateEffectCode();
      localStorage.setItem("effectCode", effectCode);
      codeEdited = false;
    }
  })

  document.querySelector("#generate-from-idea").addEventListener("click", () => {
    if (busy) return;
    if (effectPrompt.length > 0) {
      busy = true;
      document.querySelector("#busy").classList.add("active");
      askGptEffect(gptModel, prePrompt, effectPrompt, maxTokens, temperature, reasoningLevel);
      codeEditor.setValue("");
      effectCode = "";
      effectControlValues = Object.freeze({});
      normalizedControlSchema = {};
      renderEffectControls();
      localStorage.setItem("effectCode", effectCode);
    } else {
      alert("Please describe the idea");
    }
  });

  document.querySelector("#generate-from-instructions").addEventListener("click", () => {
    if (busy) return;
    if (codeInstructions.length > 0) {
      busy = true;
      document.querySelector("#busy").classList.add("active");
      askGptInstructions(gptModel, systemPrompt, `Effect Description: ${effectPrompt} | Code Guidance: ${codeInstructions}`, maxTokens, temperature, reasoningLevel);
    } else {
      alert("Please write the instructions");
    }
  });

  document.querySelector("#generate-from-refinement").addEventListener("click", () => {
    if (busy) return;
    refineCode = document.querySelector("#refine-prompt").value;
    if (refineCode.length > 0) {
      busy = true;
      document.querySelector("#busy").classList.add("active");
      askGptRefinement(gptModel, `System: ${refineCodePrompt} | Refinement: ${refineCode}`, `${effectCode}`, maxTokens, temperature, reasoningLevel);
    } else {
      alert("Please enter refinement instructions");
    }
  });
}

function refreshHistory() {
  history = [];
  if (localStorage.getItem("history")) {
    history = JSON.parse(localStorage.getItem("history"));
  }

  const historyContainer = document.querySelector("#history-list");
  historyContainer.innerHTML = "";
  history.sort((a, b) => - a.timestamp + b.timestamp);
  // history.reverse();
  history.forEach((h) => {
    const item = document.createElement("li");
    item.classList.add("history-item");

    const dateTime = document.createElement("span");
    dateTime.classList.add("date-time");
    if (h.timestamp) {
      const d = new Date(h.timestamp);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
      const day = d.getDate().toString().padStart(2, '0');
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');

      dateTime.textContent = `${year}-${month}-${day} ${hours}:${minutes}`;
    } else {
      dateTime.textContent = "???";
    }

    const isRefinement = typeof h.refinement === "string" && h.refinement.trim().length > 0;
    const historyType = document.createElement("span");
    historyType.classList.add("history-type");
    historyType.textContent = isRefinement ? "Refinement" : "Initial generation";

    const historyMeta = document.createElement("div");
    historyMeta.classList.add("history-meta");
    historyMeta.append(dateTime, historyType);

    const prompt = document.createElement("span");
    prompt.classList.add("prompt");
    prompt.textContent = h.prompt;

    item.append(historyMeta, prompt);

    if (isRefinement) {
      const refinementPrompt = document.createElement("span");
      refinementPrompt.classList.add("refinement-prompt");
      refinementPrompt.textContent = h.refinement;
      item.append(refinementPrompt);
    }

    const shareBtn = document.createElement("span");
    shareBtn.classList.add("history-btn");
    shareBtn.classList.add("with-icon");
    shareBtn.classList.add("copy-history");
    shareBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#222"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>`;
    shareBtn.addEventListener("click", (e) => {
      navigator.clipboard.writeText(`Prompt:\n\n${h.prompt}\n\n\nInstructions:\n\n${h.instructions}\n\n\nCode:\n\n${h.code}`);
      alert("Information copied to clipboard");
    });

    const instateBtn = document.createElement("span");
    instateBtn.classList.add("history-btn");
    instateBtn.classList.add("with-icon");
    instateBtn.innerHTML = `Roll back here <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>`;
    instateBtn.addEventListener("click", (e) => {
      document.querySelector("#idea-prompt").value = h.prompt;
      document.querySelector("#instructions-prompt").value = h.instructions;
      codeEditor.setValue(h.code);

      effectPrompt = h.prompt;
      codeInstructions = h.instructions;
      effectCode = h.code;

      evaluateEffectCode({ preserveControls: false });
      codeEdited = false;

      localStorage.setItem("effectPrompt", h.prompt);
      localStorage.setItem("codeInstructions", h.instructions);
      localStorage.setItem("effectCode", h.code);

      const prevActiveElement = document.querySelector(".history-item.active");
      if (prevActiveElement) {
        prevActiveElement.classList.remove("active");
        // Reset previous button text and re-enable it
        const prevBtn = prevActiveElement.querySelector(".history-btn.with-icon:last-of-type");
        if (prevBtn) {
          prevBtn.innerHTML = `Roll back here <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>`;
          prevBtn.classList.remove("disabled");
        }
      }
      item.classList.add("active");

      // Update current button text and disable it
      instateBtn.innerHTML = `Rolled back <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>`;
      instateBtn.classList.add("disabled");

      console.log("rolling back to history item");
    });

    // const deleteBtn = document.createElement("span");
    // deleteBtn.classList.add("history-btn");
    // deleteBtn.classList.add("with-icon");
    // deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
    // deleteBtn.addEventListener("click", (e) => {
    //   const userResponse = confirm("Are you sure you want to delete this item?");

    //   if (userResponse) {
    //     history = history.filter((i) => i.timestamp !== h.timestamp);
    //     localStorage.setItem("history", JSON.stringify(history));
    //     refreshHistory();
    //   } else {
    //     console.log("Deletion cancelled by the user.");
    //   }
    // });

    item.append(shareBtn);
    item.append(instateBtn);
    // item.append(deleteBtn);
    historyContainer.append(item);
  });
}

function askGptEffect(_gptModel, _systemPrompt, _userPrompt, _maxTokens, _temperature, _reasoningLevel) {
  fetch(`https://api.openai.com/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: _gptModel,
      input: [
        { role: "system", content: _systemPrompt },
        { role: "user", content: _userPrompt },
      ],
      max_output_tokens: _maxTokens,
      reasoning: { effort: _reasoningLevel }
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
      if (data.error) {
        alert(`Error: ${data.error.message}`);
        busy = false;
        document.querySelector("#busy").classList.remove("active");
      } else {
        let content = ""
        if (typeof data.output_text === "string" && data.output_text.trim()) {
          content = data.output_text.trim();
        } else if (Array.isArray(data.output)) {
          content = data.output
            .flatMap(o => (o.content || []))
            .map(c => c.text || "")
            .join("")
            .trim();
        } else if (typeof data.text === "string" && data.text.trim()) {
          content = data.text.trim();
        }

        if (content.length === 0) {
          alert("No response from the API");
        } else {
          // codeInstructions = data.choices[0].message.content;
          codeInstructions = content;
          console.log(codeInstructions);
          document.querySelector("#instructions-prompt").value = codeInstructions;
          localStorage.setItem("codeInstructions", codeInstructions);
          document.querySelector("#tab-instructions").click();
        }
        busy = false;
        document.querySelector("#busy").classList.remove("active");
      }
    })
    .catch((error) => {
      alert(`Error: ${error}`);
      busy = false;
      document.querySelector("#busy").classList.remove("active");
    });
}

function askGptInstructions(_gptModel, _systemPrompt, _userPrompt, _maxTokens, _temperature, _reasoningLevel) {
  fetch(`https://api.openai.com/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: _gptModel,
      input: [
        { role: "system", content: _systemPrompt },
        { role: "user", content: _userPrompt },
      ],
      max_output_tokens: _maxTokens,
      reasoning: { effort: _reasoningLevel }
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
      if (data.error) {
        alert(`Error: ${data.error.message}`);
        busy = false;
        document.querySelector("#busy").classList.remove("active");
      } else {
        let content = ""
        if (typeof data.output_text === "string" && data.output_text.trim()) {
          content = data.output_text.trim();
        } else if (Array.isArray(data.output)) {
          content = data.output
            .flatMap(o => (o.content || []))
            .map(c => c.text || "")
            .join("")
            .trim();
        } else if (typeof data.text === "string" && data.text.trim()) {
          content = data.text.trim();
        }

        if (content.length === 0) {
          alert("No response from the API");
        } else {
          // effectCode = data.choices[0].message.content;
          effectCode = content;
          console.log(effectCode);
          codeEditor.setValue(effectCode);
          localStorage.setItem("effectCode", effectCode);
          evaluateEffectCode({ preserveControls: false, restorePersisted: false });
          busy = false;
          codeEdited = false;

          history = [];
          if (localStorage.getItem("history")) {
            history = JSON.parse(localStorage.getItem("history"));
          };
          history.push({ timestamp: Date.now(), prompt: effectPrompt, code: effectCode, instructions: codeInstructions });
          localStorage.setItem("history", JSON.stringify(history));
          refreshHistory();
          const historyItems = document.querySelectorAll("#history-list .history-item");
          historyItems[0].classList.add("active");

          document.querySelector("#tab-effect").click();
        }

        document.querySelector("#busy").classList.remove("active");
      }
    })
    .catch((error) => {
      alert(`Error: ${error}`);
      busy = false;
      document.querySelector("#busy").classList.remove("active");
    });
}

function askGptRefinement(_gptModel, _systemPrompt, _userPrompt, _maxTokens, _temperature, _reasoningLevel) {
  fetch(`https://api.openai.com/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: _gptModel,
      input: [
        { role: "system", content: _systemPrompt },
        { role: "user", content: _userPrompt },
      ],
      max_output_tokens: _maxTokens,    
      reasoning: { effort: _reasoningLevel }
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
      if (data.error) {
        alert(`Error: ${data.error.message}`);
        busy = false;
        document.querySelector("#busy").classList.remove("active");
      } else {
        let content = ""
        if (typeof data.output_text === "string" && data.output_text.trim()) {
          content = data.output_text.trim();
        } else if (Array.isArray(data.output)) {
          content = data.output
            .flatMap(o => (o.content || []))
            .map(c => c.text || "")
            .join("")
            .trim();
        } else if (typeof data.text === "string" && data.text.trim()) {
          content = data.text.trim();
        }

        if (content.length === 0) {
          alert("No response from the API");
        } else {
          // effectCode = data.choices[0].message.content;
          effectCode = content;
          console.log(effectCode);
          codeEditor.setValue(effectCode);
          localStorage.setItem("effectCode", effectCode);
          evaluateEffectCode();
          busy = false;
          codeEdited = false;

          document.querySelector("#refine-prompt").value = "";
          history = [];
          if (localStorage.getItem("history")) {
            history = JSON.parse(localStorage.getItem("history"));
          };
          history.push({ timestamp: Date.now(), prompt: effectPrompt, code: effectCode, instructions: codeInstructions, refinement: refineCode });
          localStorage.setItem("history", JSON.stringify(history));
          refreshHistory();
          const historyItems = document.querySelectorAll("#history-list .history-item");
          historyItems[0].classList.add("active");
        }

        document.querySelector("#busy").classList.remove("active");

      }
    })
    .catch((error) => {
      alert(`Error: ${error}`);
      busy = false;
      document.querySelector("#busy").classList.remove("active");
    });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getEffectControlsStorageKey() {
  let hash = 5381;
  for (let i = 0; i < effectCode.length; i++) {
    hash = ((hash << 5) + hash) ^ effectCode.charCodeAt(i);
  }
  return `effectControlValues:${hash >>> 0}`;
}

function normalizeControlSchema(schema) {
  if (!isPlainObject(schema)) return {};

  const normalized = {};
  Object.entries(schema).forEach(([key, definition]) => {
    if (!/^[A-Za-z_$][\w$]*$/.test(key) || !isPlainObject(definition)) return;

    const type = definition.type;
    const label = typeof definition.label === "string" && definition.label.trim()
      ? definition.label.trim().slice(0, 80)
      : key;

    if (type === "range") {
      const min = Number(definition.min);
      const max = Number(definition.max);
      const step = Number(definition.step);
      const defaultValue = Number(definition.default);
      if (![min, max, step, defaultValue].every(Number.isFinite) || min >= max || step <= 0) return;
      normalized[key] = {
        type,
        label,
        min,
        max,
        step,
        default: constrain(defaultValue, min, max)
      };
    } else if (type === "color") {
      if (typeof definition.default !== "string" || !/^#[0-9a-f]{6}$/i.test(definition.default)) return;
      normalized[key] = { type, label, default: definition.default };
    } else if (type === "checkbox") {
      if (typeof definition.default !== "boolean") return;
      normalized[key] = { type, label, default: definition.default };
    } else if (type === "select") {
      if (!Array.isArray(definition.options)) return;
      const options = definition.options
        .filter((option) => typeof option === "string")
        .map((option) => option.slice(0, 80))
        .slice(0, 20);
      if (options.length === 0 || typeof definition.default !== "string" || !options.includes(definition.default)) return;
      normalized[key] = { type, label, default: definition.default, options };
    }
  });

  return normalized;
}

function normalizeControlValue(definition, value) {
  if (definition.type === "range") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
      ? constrain(numericValue, definition.min, definition.max)
      : definition.default;
  }
  if (definition.type === "color") {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
      ? value
      : definition.default;
  }
  if (definition.type === "checkbox") {
    return typeof value === "boolean" ? value : definition.default;
  }
  if (definition.type === "select") {
    return definition.options.includes(value) ? value : definition.default;
  }
  return definition.default;
}

function readPersistedEffectControlValues() {
  try {
    const saved = JSON.parse(localStorage.getItem(getEffectControlsStorageKey()));
    return isPlainObject(saved) ? saved : {};
  } catch (error) {
    return {};
  }
}

function persistEffectControlValues() {
  if (!effectCode) return;
  localStorage.setItem(getEffectControlsStorageKey(), JSON.stringify(effectControlValues));
}

function initializeEffectControls({ preserveControls = true, restorePersisted = true, controlValues } = {}) {
  const previousValues = effectControlValues;
  normalizedControlSchema = normalizeControlSchema(effect && effect.controlSchema);

  let candidateValues = {};
  if (restorePersisted) candidateValues = readPersistedEffectControlValues();
  if (preserveControls) candidateValues = { ...candidateValues, ...previousValues };
  if (isPlainObject(controlValues)) candidateValues = { ...candidateValues, ...controlValues };

  effectControlValues = {};
  Object.entries(normalizedControlSchema).forEach(([key, definition]) => {
    const candidate = Object.prototype.hasOwnProperty.call(candidateValues, key)
      ? candidateValues[key]
      : definition.default;
    effectControlValues[key] = normalizeControlValue(definition, candidate);
  });
  effectControlValues = Object.freeze(effectControlValues);

  renderEffectControls();
  persistEffectControlValues();
}

function closeEffectControls(restoreFocus = true) {
  const panel = document.querySelector("#effect-controls-panel");
  const button = document.querySelector("#controls-btn");
  if (!panel || !button) return;
  if (restoreFocus && panel.classList.contains("active")) button.focus({ preventScroll: true });
  panel.classList.remove("active");
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  button.setAttribute("aria-expanded", "false");
}

function renderEffectControls() {
  const container = document.querySelector("#effect-controls");
  const button = document.querySelector("#controls-btn");
  if (!container || !button) return;

  container.replaceChildren();
  const controls = Object.entries(normalizedControlSchema);
  button.hidden = controls.length === 0;
  if (controls.length === 0) {
    closeEffectControls(false);
    return;
  }

  controls.forEach(([key, definition]) => {
    const field = document.createElement("div");
    field.className = `effect-control effect-control-${definition.type}`;

    const label = document.createElement("label");
    label.htmlFor = `effect-control-${key}`;
    label.textContent = definition.label;

    const input = document.createElement(definition.type === "select" ? "select" : "input");
    input.id = `effect-control-${key}`;
    input.dataset.controlKey = key;

    let output;
    if (definition.type === "range") {
      input.type = "range";
      input.min = definition.min;
      input.max = definition.max;
      input.step = definition.step;
      input.value = effectControlValues[key];
      output = document.createElement("output");
      output.setAttribute("for", input.id);
      output.textContent = effectControlValues[key];
      field.append(label, output, input);
    } else if (definition.type === "color") {
      input.type = "color";
      input.value = effectControlValues[key];
      field.append(label, input);
    } else if (definition.type === "checkbox") {
      input.type = "checkbox";
      input.checked = effectControlValues[key];
      field.append(input, label);
    } else {
      definition.options.forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        input.append(option);
      });
      input.value = effectControlValues[key];
      field.append(label, input);
    }

    input.addEventListener("input", () => {
      const rawValue = definition.type === "checkbox" ? input.checked : input.value;
      effectControlValues = Object.freeze({
        ...effectControlValues,
        [key]: normalizeControlValue(definition, rawValue)
      });
      if (output) output.textContent = effectControlValues[key];
      persistEffectControlValues();
    });

    container.append(field);
  });
}

function isEffectControlsEvent(event) {
  return Boolean(event && event.target && event.target.closest("#effect-controls-panel, #controls-btn"));
}

function hasValidEffectContract(candidate) {
  return candidate !== null
    && typeof candidate === "object"
    && Number.isFinite(candidate.triggered)
    && Number.isFinite(candidate.duration)
    && candidate.duration > 0
    && typeof candidate.trigger === "function"
    && typeof candidate.update === "function"
    && typeof candidate.display === "function";
}

function evaluateEffectCode(controlOptions = {}) {
  try {
    const evaluatedEffect = eval(`(${effectCode})`);
    if (!hasValidEffectContract(evaluatedEffect)) {
      throw new Error("Effect code is missing a valid triggered, duration, trigger, update, or display property.");
    }
    effect = evaluatedEffect;
    effects = [];
    varContainer = {};
    initializeEffectControls(controlOptions);
    codeError = false;
    return true;
  } catch (e) {
    effect = undefined;
    effects = [];
    varContainer = {};
    normalizedControlSchema = {};
    effectControlValues = Object.freeze({});
    renderEffectControls();
    codeError = true;
    alert(e);
    return false;
  }
}

function draw() {
  background(bgc);
  if (checkEffect() && !codeError && !codeEdited) {
    effects = effects.filter((e) => millis() - e.triggered < e.duration);
    effects.forEach((e) => {
      try {
        e.update(effects, effectControlValues);
      } catch (err) {
        codeError = true;
        alert(`Update code error, try generating again. \n${err}`)
      }
    });

    effects.forEach((e) => {
      try {
        e.display(effects, effectControlValues);
      } catch (err) {
        codeError = true;
        alert(`Display code error, try generating again. \n${err}`)
      }
    });
  }

  if (codeError && effects.length > 0) {
    effects = [];
  }
}

function mousePressed(event) {
  if (isEffectControlsEvent(event)) return;
  if (checkEffect() && !codeError && !codeEdited) {
    if (millis() - triggerTimestamp > triggerDebounce) {
      effects.push({ ...effect });
      try {
        effects.at(-1).trigger(effects, mouseX, mouseY, effectControlValues);
        triggerTimestamp = millis();
      } catch (err) {
        codeError = true;
        alert(`Trigger code error, try generating again. \n${err}`)
      }
    }
  }
}

function mouseMoved(event) {
  if (isEffectControlsEvent(event)) return;
  if (checkEffect() && !codeError && !codeEdited) {
    if (millis() - triggerTimestamp > triggerDebounce && mouseIsPressed) {
      effects.push({ ...effect });
      try {
        effects.at(-1).trigger(effects, mouseX, mouseY, effectControlValues);
        triggerTimestamp = millis();
      } catch (err) {
        codeError = true;
        alert(`Trigger code error, try generating again. \n${err}`)
      }
    }
  }
}

function touchStarted(event) {
  if (isEffectControlsEvent(event)) return;
  if (checkEffect() && !codeError && !codeEdited) {
    if (millis() - triggerTimestamp > triggerDebounce) {
      effects.push({ ...effect });
      try {
        effects.at(-1).trigger(effects, mouseX, mouseY, effectControlValues);
        triggerTimestamp = millis();
      } catch (err) {
        codeError = true;
        alert(`Trigger code error, try generating again. \n${err}`)
      }
    }
  }
}

function touchMoved(evt) {
  if (isEffectControlsEvent(evt)) return;
  if (checkEffect() && !codeError && !codeEdited) {
    if (document.querySelector("#canvas-container").classList.contains("active")) {
      evt.preventDefault();
    }
    if (millis() - triggerTimestamp > triggerDebounce) {
      effects.push({ ...effect });
      try {
        effects.at(-1).trigger(effects, mouseX, mouseY, effectControlValues);
        triggerTimestamp = millis();
      } catch (err) {
        codeError = true;
        alert(`Trigger code error, try generating again. \n${err}`)
      }
    }
  }
}

function touchEnded() {
  triggerTimestamp = -1;
}

function checkEffect() {
  if (document.querySelector("#editor-container").classList.contains("active") && !drawOverride) return false;
  return hasValidEffectContract(effect);
}

var effects = [];

var effect;

function updateSpells() {
  const spellList = document.querySelector("#spell-list");
  spellList.innerHTML = "";

  const addSpellBtn = document.createElement("div");
  addSpellBtn.id = "add-spell-btn";
  addSpellBtn.classList.add("spell-item");
  addSpellBtn.innerHTML = `<span class="material-symbols-outlined">add_2</span><br><span>Create new spell</span>`;
  addSpellBtn.addEventListener("click", (e) => {
    document.querySelector("#idea-prompt").value = ``;
    document.querySelector("#instructions-prompt").value = ``;
    document.querySelector("#refine-prompt").value = ``;
    codeEditor.setValue(``);
    document.querySelector(`#spellbook-container`).classList.remove("active");
    document.querySelector(`#tab-idea`).click();
  });

  spellList.append(addSpellBtn);

  spells.forEach(s => {
    const spellItem = document.createElement("div");
    spellItem.classList.add("spell-item");
    const d = new Date(s.timestamp);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    spellItem.innerHTML = `
      <div class="spell-img" ${s.thumbnail ? 'style="background-image: url(' + s.thumbnail + ');"' : ""}></div>
      <div class="spell-meta">
        <h3>${s.name}</h3>
        <span class="date-time">${year}-${month}-${day} ${hours}:${minutes}</span>
      </div>
    `;
    if (s.type === "example") {
      spellItem.classList.add("example");
    } else {
      const delSpell = document.createElement("div");
      delSpell.classList.add("del-spell-btn");
      delSpell.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
      delSpell.addEventListener("click", (e) => {
        spells = spells.filter((i) => i.timestamp !== s.timestamp);
        localStorage.setItem("spells", JSON.stringify(spells));
        updateSpells();
        e.stopPropagation();
      });
      spellItem.append(delSpell);
    }
    spellItem.addEventListener("click", (e) => {
      document.querySelector("#load-spell-modal-wrapper").innerHTML = `loading ${s.name}...`
      document.querySelector("#load-spell-modal-wrapper").classList.add("active");
      bgc = s.bgc ? s.bgc : "#141414";
      selectColorSwatch(bgc);
      document.querySelector("#idea-prompt").value = s.idea;
      document.querySelector("#instructions-prompt").value = s.instructions;
      codeEditor.setValue(s.code);
      effectPrompt = s.idea;
      codeInstructions = s.instructions;
      effectCode = s.code;
      evaluateEffectCode({ preserveControls: false, controlValues: s.controlValues });
      localStorage.setItem("backgroundColor", bgc);
      localStorage.setItem("effectPrompt", s.idea);
      localStorage.setItem("codeInstructions", s.instructions);
      localStorage.setItem("effectCode", s.code);
      busy = false;
      codeEdited = false;
      setTimeout(() => {
        document.querySelector("#load-spell-modal-wrapper").classList.remove("active");
        document.querySelector(`#spellbook-container`).classList.remove("active");
      }, 600);
    });

    spellList.append(spellItem);
  });
}

const saveSpell = () => {

  drawOverride = true;
  const sx = canvasEle.width * 0.3;
  const sy = canvasEle.height * 0.3;
  const ex = canvasEle.width * 0.7;
  const ey = canvasEle.height * 0.7;
  const t = min(effect.duration * 0.55, 10000);
  autoGenerateEffect(sx, sy, ex, ey, t);
  document.querySelector("#spell-saving-modal-wrapper").classList.add("active");

  setTimeout(() => {
    const imgData = document.querySelector("canvas").toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 300;
      tempCanvas.height = 300 / canvasEle.width * canvasEle.height;
      tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, tempCanvas.width * -0.6, tempCanvas.height * -0.6, tempCanvas.width * 2.4, tempCanvas.height * 2.4);
      const spellName = document.querySelector("#spell-name").value;
      const newSpell = {
        name: spellName,
        timestamp: Date.now(),
        type: `user`,
        idea: effectPrompt,
        instructions: codeInstructions,
        code: effectCode,
        bgc: bgc,
        controlValues: { ...effectControlValues },
        thumbnail: tempCanvas.toDataURL('image/png'),
      }

      spells.push(newSpell);
      updateSpells();
      localStorage.setItem("spells", JSON.stringify(spells));
      drawOverride = false;
      document.querySelector("#save-spell-modal-wrapper").classList.remove("active");
      document.querySelector("#spellbook-btn").click();
      document.querySelector("#spell-saving-modal-wrapper").classList.remove("active");
    }
    img.src = imgData;
  }, min(effect.duration * 0.5, 10000));
}

// function keyPressed() {
//   sx = canvasEle.width * 0.3;
//   sy = canvasEle.height * 0.3;
//   ex = canvasEle.width * 0.7;
//   ey = canvasEle.height * 0.7;
//   autoGenerateEffect(sx, sy, ex, ey);
// }

const autoGenerateEffect = (sx, sy, ex, ey, t) => {

  const timestamps = [];
  for (let i = 0; i < 20; i++) {
    timestamps.push(i * t / 20);
  }

  for (let i = 0; i < timestamps.length; i++) {
    setTimeout(() => {
      effects.push({ ...effect });
      const x = random(sx, ex);
      const y = random(sy, ey);
      effects.at(-1).trigger(effects, x, y, effectControlValues);
    }, timestamps[i]);
  }


  // setTimeout(() => {
  //   console.log(document.querySelector("canvas").toDataURL('image/png'));
  // }, 100);
}

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
  const activeSidebar = document.querySelector('.side-bar.active');

  if (activeSidebar) {
    const clickedInside = activeSidebar.contains(event.target);
    const clickedTrigger = event.target.closest('#settings-btn, #history-btn, #spellbook-btn');

    if (!clickedInside && !clickedTrigger) {
      event.preventDefault();
      event.stopPropagation();
      activeSidebar.classList.remove('active');
    }
  }
}, true);

// Close current sidebar when opening a different one
document.querySelectorAll('#settings-btn, #history-btn, #spellbook-btn').forEach(btn => {
  btn.addEventListener('click', function(event) {
    // Close all open sidebars first
    document.querySelectorAll('.side-bar.active').forEach(sidebar => {
      sidebar.classList.remove('active');
    });

    // Then your normal logic to open the clicked sidebar will run
  }, true);
});