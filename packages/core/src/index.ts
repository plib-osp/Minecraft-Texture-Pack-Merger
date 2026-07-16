export { loadPack, loadPackFromFile, loadPackFromUrl, loadPackFromBuffer, generateId } from "./engine/loader.ts"
export { validatePack, validatePackBuffer } from "./engine/validator.ts"
export { detectConflicts, buildFileTree, buildTree } from "./engine/conflict.ts"
export { mergePacks, createMergeJob, executeMergeJob } from "./engine/merger.ts"
export { generateMcmeta, updateMcmeta, parseMcmeta } from "./engine/metadata.ts"
export { PluginRegistry } from "./plugin/registry.ts"
export type { MergePlugin } from "./plugin/types.ts"

export type {
  PackFile,
  TexturePack,
  Conflict,
  PackValidation,
  MergeProgress,
  McmetaData,
  McmetaPack,
  OutputMetadata,
  MergeConfig,
  MergeJob,
  PackSource,
  FolderNode,
  FileNode,
  TreeNode,
  BeforeMergeContext,
  AfterMergeContext,
  ConflictContext,
  ValidateContext,
  MetadataContext,
  WriteContext,
} from "./types.ts"
