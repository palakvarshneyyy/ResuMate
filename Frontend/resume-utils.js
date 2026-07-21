function getFileExtension(file) {
    const name = file && file.name ? file.name : "";
    const parts = name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function updateProgress(onProgress, value) {
    if (typeof onProgress === "function") {
        onProgress(value);
    }
}

async function readFileWithFetch(file, onProgress) {
    const objectUrl = URL.createObjectURL(file);

    try {
        const response = await fetch(objectUrl);

        if (!response.ok) {
            throw new Error("Unable to read selected file.");
        }

        const reader = response.body && response.body.getReader
            ? response.body.getReader()
            : null;

        if (!reader) {
            updateProgress(onProgress, 40);
            return await response.arrayBuffer();
        }

        const chunks = [];
        let receivedLength = 0;

        while (true) {
            const result = await reader.read();

            if (result.done) {
                break;
            }

            chunks.push(result.value);
            receivedLength += result.value.length;

            if (file.size > 0) {
                updateProgress(onProgress, Math.min(45, Math.round((receivedLength / file.size) * 45)));
            }
        }

        const bytes = new Uint8Array(receivedLength);
        let position = 0;

        chunks.forEach(function(chunk) {
            bytes.set(chunk, position);
            position += chunk.length;
        });

        return bytes.buffer;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function readUInt16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32(bytes, offset) {
    return (bytes[offset] |
        (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 24)) >>> 0;
}

function decodeXmlEntities(text) {
    const textarea = typeof document !== "undefined"
        ? document.createElement("textarea")
        : null;

    if (!textarea) {
        return text
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&apos;/g, "'");
    }

    textarea.innerHTML = text;
    return textarea.value;
}

async function inflateRaw(data) {
    if (typeof DecompressionStream === "undefined") {
        throw new Error("DOCX reading is not available in this browser.");
    }

    let stream;

    try {
        stream = new Blob([data]).stream().pipeThrough(
            new DecompressionStream("deflate-raw")
        );
    } catch (error) {
        stream = new Blob([data]).stream().pipeThrough(
            new DecompressionStream("deflate")
        );
    }

    return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractDocxText(arrayBuffer, onProgress) {
    const bytes = new Uint8Array(arrayBuffer);
    let endOfCentralDirectory = -1;

    for (let i = bytes.length - 22; i >= 0; i -= 1) {
        if (readUInt32(bytes, i) === 0x06054b50) {
            endOfCentralDirectory = i;
            break;
        }
    }

    if (endOfCentralDirectory === -1) {
        throw new Error("Invalid DOCX file.");
    }

    const centralDirectoryOffset = readUInt32(bytes, endOfCentralDirectory + 16);
    let offset = centralDirectoryOffset;
    let documentEntry = null;

    updateProgress(onProgress, 55);

    while (offset < bytes.length && readUInt32(bytes, offset) === 0x02014b50) {
        const compressionMethod = readUInt16(bytes, offset + 10);
        const compressedSize = readUInt32(bytes, offset + 20);
        const fileNameLength = readUInt16(bytes, offset + 28);
        const extraLength = readUInt16(bytes, offset + 30);
        const commentLength = readUInt16(bytes, offset + 32);
        const localHeaderOffset = readUInt32(bytes, offset + 42);
        const fileNameBytes = bytes.slice(offset + 46, offset + 46 + fileNameLength);
        const fileName = new TextDecoder("utf-8").decode(fileNameBytes);

        if (fileName === "word/document.xml") {
            documentEntry = {
                compressionMethod: compressionMethod,
                compressedSize: compressedSize,
                localHeaderOffset: localHeaderOffset
            };
            break;
        }

        offset += 46 + fileNameLength + extraLength + commentLength;
    }

    if (!documentEntry) {
        throw new Error("DOCX document content was not found.");
    }

    const localOffset = documentEntry.localHeaderOffset;

    if (readUInt32(bytes, localOffset) !== 0x04034b50) {
        throw new Error("Invalid DOCX document content.");
    }

    const localNameLength = readUInt16(bytes, localOffset + 26);
    const localExtraLength = readUInt16(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedData = bytes.slice(dataStart, dataStart + documentEntry.compressedSize);
    const xmlBytes = documentEntry.compressionMethod === 0
        ? compressedData
        : await inflateRaw(compressedData);

    updateProgress(onProgress, 80);

    const xml = new TextDecoder("utf-8").decode(xmlBytes);
    const textParts = [];
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>|<\/w:p>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
        if (match[1] !== undefined) {
            textParts.push(decodeXmlEntities(match[1]));
        } else if (match[0].indexOf("w:tab") !== -1) {
            textParts.push(" ");
        } else {
            textParts.push("\n");
        }
    }

    const text = textParts.join(" ").replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();

    if (!text) {
        throw new Error("No readable text found in DOCX file.");
    }

    updateProgress(onProgress, 95);
    return text;
}

async function extractResumeText(file, pdfjsLib, readTextFile, onProgress) {
    if (!file) {
        throw new Error("No file selected.");
    }

    const extension = getFileExtension(file);

    if (extension === "pdf") {
        if (!pdfjsLib || typeof pdfjsLib.getDocument !== "function") {
            throw new Error("PDF reader is not available in this browser.");
        }

        const arrayBuffer = await readFileWithFetch(file, onProgress);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + " ";
            updateProgress(onProgress, 45 + Math.round((pageNumber / pdf.numPages) * 50));
        }

        return text.trim();
    }

    if (extension === "docx") {
        const arrayBuffer = await readFileWithFetch(file, onProgress);
        return await extractDocxText(arrayBuffer, onProgress);
    }

    throw new Error("Please upload a PDF or DOCX resume.");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        extractResumeText,
        getFileExtension
    };
}

if (typeof window !== "undefined") {
    window.ResumeUtils = {
        extractResumeText,
        getFileExtension
    };
}
