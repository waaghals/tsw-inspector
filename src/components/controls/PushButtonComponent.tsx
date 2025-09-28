import { PushButtonComponentProps } from "@/types";

export function PushButtonComponent({ nodePath, client }: PushButtonComponentProps) {
  const handlePushButtonPress = async () => {
    if (!client) return;

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      await client.set(`${apiNodePath}.InputValue`, 1);
    } catch {
      console.error('Failed to set button press');
    }
  };

  const handlePushButtonRelease = async () => {
    if (!client) return;

    try {
      const apiNodePath = nodePath.startsWith('Root/') ? nodePath.substring(5) : nodePath;
      await client.set(`${apiNodePath}.InputValue`, 0);
    } catch {
      console.error('Failed to set button release');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
        Interactive push button - Press and hold to send value 1, release to send value 0
      </p>
      <button
        onMouseDown={handlePushButtonPress}
        onMouseUp={handlePushButtonRelease}
        onMouseLeave={handlePushButtonRelease}
        onTouchStart={handlePushButtonPress}
        onTouchEnd={handlePushButtonRelease}
        className="w-32 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-lg transition-colors select-none"
        style={{ userSelect: 'none' }}
      >
        PUSH
      </button>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Click and hold or touch and hold to activate
      </p>
    </div>
  );
}