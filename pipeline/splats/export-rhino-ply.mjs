#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { one, parseArgs } from "../asset-pipeline/fal-queue.mjs";

const SH_C0 = 0.28209479177387814;
const REQUIRED_PROPERTIES = ["x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2"];

function usage() {
  return "Usage: node pipeline/splats/export-rhino-ply.mjs --input <gaussian.ply> [--output <rhino-colored.ply>]";
}

function readHeader(buffer) {
  const marker = Buffer.from("end_header\n");
  let headerEnd = buffer.indexOf(marker);
  let markerLength = marker.length;

  if (headerEnd === -1) {
    const crlfMarker = Buffer.from("end_header\r\n");
    headerEnd = buffer.indexOf(crlfMarker);
    markerLength = crlfMarker.length;
  }
  if (headerEnd === -1) throw new Error("PLY header is missing end_header.");

  const header = buffer.subarray(0, headerEnd + markerLength).toString("utf8");
  const lines = header.trimEnd().split(/\r?\n/);
  const format = lines.find((line) => line.startsWith("format "))?.split(/\s+/)[1];
  if (format !== "binary_little_endian") {
    throw new Error(`Only binary_little_endian PLY is supported, got ${format || "unknown"}.`);
  }

  const vertexLineIndex = lines.findIndex((line) => line.startsWith("element vertex "));
  if (vertexLineIndex === -1) throw new Error("PLY header is missing element vertex.");
  const vertexCount = Number(lines[vertexLineIndex].split(/\s+/)[2]);
  if (!Number.isInteger(vertexCount) || vertexCount < 0) throw new Error("Invalid PLY vertex count.");

  const properties = [];
  for (let i = vertexLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("element ") || line === "end_header") break;
    const parts = line.split(/\s+/);
    if (parts[0] === "property") properties.push({ type: parts[1], name: parts[2] });
  }

  for (const name of REQUIRED_PROPERTIES) {
    if (!properties.some((property) => property.name === name)) {
      throw new Error(`PLY is missing required Gaussian property ${name}.`);
    }
  }

  return {
    dataOffset: headerEnd + markerLength,
    properties,
    vertexCount
  };
}

function propertySize(type) {
  switch (type) {
    case "float":
    case "float32":
    case "uint":
    case "uint32":
    case "int":
    case "int32":
      return 4;
    case "double":
    case "float64":
      return 8;
    case "uchar":
    case "uint8":
    case "char":
    case "int8":
      return 1;
    case "ushort":
    case "uint16":
    case "short":
    case "int16":
      return 2;
    default:
      throw new Error(`Unsupported PLY property type ${type}.`);
  }
}

function readNumber(view, offset, type) {
  switch (type) {
    case "float":
    case "float32":
      return view.getFloat32(offset, true);
    case "double":
    case "float64":
      return view.getFloat64(offset, true);
    case "uchar":
    case "uint8":
      return view.getUint8(offset);
    case "char":
    case "int8":
      return view.getInt8(offset);
    case "ushort":
    case "uint16":
      return view.getUint16(offset, true);
    case "short":
    case "int16":
      return view.getInt16(offset, true);
    case "uint":
    case "uint32":
      return view.getUint32(offset, true);
    case "int":
    case "int32":
      return view.getInt32(offset, true);
    default:
      throw new Error(`Unsupported PLY property type ${type}.`);
  }
}

function colorFromDc(value) {
  return Math.max(0, Math.min(255, Math.round((0.5 + SH_C0 * value) * 255)));
}

function defaultOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}-rhino-rgb${parsed.ext || ".ply"}`);
}

export async function exportRhinoPly(inputPath, outputPath = defaultOutputPath(inputPath)) {
  const source = await readFile(inputPath);
  const { dataOffset, properties, vertexCount } = readHeader(source);
  const stride = properties.reduce((sum, property) => sum + propertySize(property.type), 0);
  const expectedLength = dataOffset + stride * vertexCount;
  if (source.length < expectedLength) {
    throw new Error("PLY data is shorter than the declared vertex payload.");
  }

  const sourceView = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const outHeader = [
    "ply",
    "format binary_little_endian 1.0",
    `element vertex ${vertexCount}`,
    "property float x",
    "property float y",
    "property float z",
    "property uchar red",
    "property uchar green",
    "property uchar blue",
    "end_header",
    ""
  ].join("\n");
  const headerBuffer = Buffer.from(outHeader, "utf8");
  const vertexBytes = 15;
  const output = Buffer.alloc(headerBuffer.length + vertexBytes * vertexCount);
  headerBuffer.copy(output, 0);
  const outputView = new DataView(output.buffer, output.byteOffset, output.byteLength);

  const offsets = new Map();
  let offset = 0;
  for (const property of properties) {
    offsets.set(property.name, { offset, type: property.type });
    offset += propertySize(property.type);
  }

  for (let i = 0; i < vertexCount; i += 1) {
    const base = dataOffset + i * stride;
    const outBase = headerBuffer.length + i * vertexBytes;
    const readProperty = (name) => {
      const property = offsets.get(name);
      return readNumber(sourceView, base + property.offset, property.type);
    };

    outputView.setFloat32(outBase, readProperty("x"), true);
    outputView.setFloat32(outBase + 4, readProperty("y"), true);
    outputView.setFloat32(outBase + 8, readProperty("z"), true);
    output[outBase + 12] = colorFromDc(readProperty("f_dc_0"));
    output[outBase + 13] = colorFromDc(readProperty("f_dc_1"));
    output[outBase + 14] = colorFromDc(readProperty("f_dc_2"));
  }

  await writeFile(outputPath, output);
  return { input: inputPath, output: outputPath, vertex_count: vertexCount };
}

async function main() {
  const { flags } = parseArgs();
  const input = one(flags, "input") || one(flags, "from");
  if (!input) throw new Error(usage());

  const output = one(flags, "output") || one(flags, "to") || defaultOutputPath(input);
  console.log(JSON.stringify(await exportRhinoPly(input, output), null, 2));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], `file://${process.cwd()}/`).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
