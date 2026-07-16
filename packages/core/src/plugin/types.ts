import type {
  BeforeMergeContext,
  AfterMergeContext,
  ConflictContext,
  ValidateContext,
  MetadataContext,
  WriteContext,
} from "../types.ts"

export interface MergePlugin {
  name: string
  version: string
  description?: string

  onBeforeMerge?(ctx: BeforeMergeContext): Promise<BeforeMergeContext>
  onAfterMerge?(ctx: AfterMergeContext): Promise<AfterMergeContext>
  onConflictDetect?(ctx: ConflictContext): Promise<ConflictContext>
  onValidate?(ctx: ValidateContext): Promise<ValidateContext>
  onTransformMetadata?(ctx: MetadataContext): Promise<MetadataContext>
  onBeforeWrite?(ctx: WriteContext): Promise<WriteContext>
}
