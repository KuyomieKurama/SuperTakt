import type { AddinContextDto, TagTreeDto } from '../api/types.ts';
import type { AddinDefaults } from './store.ts';

export function tagIdsInTree(tree: TagTreeDto): ReadonlySet<string> {
  const ids = new Set(tree.rootTags.map(tag => tag.id));
  const visit = (nodes: TagTreeDto['rootFolders']): void => {
    for (const node of nodes) { node.tags.forEach(tag => ids.add(tag.id)); visit(node.subfolders); }
  };
  visit(tree.rootFolders);
  return ids;
}
export function validDefaults(defaults: AddinDefaults, context: AddinContextDto): AddinDefaults {
  const ids = tagIdsInTree(context.tagTree);
  return { ...defaults, tagIds: defaults.tagIds.filter(id => ids.has(id)),
    statusId: context.statuses.some(status => status.id === defaults.statusId) ? defaults.statusId : context.defaultStatusId };
}
