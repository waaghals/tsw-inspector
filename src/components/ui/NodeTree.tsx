import { useState, useEffect } from "react";
import { NodeTreeProps } from "@/types";

export function NodeTree({ node, level, onNodeClick, searchTerm }: NodeTreeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.Nodes && node.Nodes.length > 0;

  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm || !searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-semibold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  useEffect(() => {
    if (searchTerm && searchTerm.trim() && hasChildren) {
      setExpanded(true);
    }
  }, [searchTerm, hasChildren]);

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onNodeClick(node.NodePath);
        }}
      >
        {hasChildren && (
          <span className="mr-2 text-xs">
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!hasChildren && <span className="mr-2 text-xs opacity-0">▶</span>}
        <span className="text-sm font-mono">{highlightText(node.NodeName, searchTerm)}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.Nodes!.map((child) => (
            <NodeTree
              key={child.NodePath}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}