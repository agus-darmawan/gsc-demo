import type { DropTarget, DropTargetInput } from "@/types/drop";

export interface DropsApi {
  /** GET /drops */
  list(): Promise<DropTarget[]>;
  /** POST /drops */
  create(input: DropTargetInput): Promise<DropTarget>;
  /** PUT /drops/:id */
  update(id: string, input: DropTargetInput): Promise<DropTarget>;
  /** DELETE /drops/:id */
  remove(id: string): Promise<void>;
  /** POST /drops/:id/execute -> assigned drone flies there and releases */
  execute(id: string): Promise<DropTarget>;
  /** POST /drops/:id/cancel */
  cancel(id: string): Promise<DropTarget>;
}
