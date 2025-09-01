import React from "react";

export function KeyboardShortcutsHelp() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">Navigation</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Arrow Keys</span>
              <span className="text-gray-600">Navigate items</span>
            </div>
            <div className="flex justify-between">
              <span>Enter</span>
              <span className="text-gray-600">Open item</span>
            </div>
            <div className="flex justify-between">
              <span>Escape</span>
              <span className="text-gray-600">Close/Cancel</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Selection</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Ctrl/Cmd + A</span>
              <span className="text-gray-600">Select all</span>
            </div>
            <div className="flex justify-between">
              <span>Ctrl/Cmd + M</span>
              <span className="text-gray-600">Toggle select mode</span>
            </div>
            <div className="flex justify-between">
              <span>Space</span>
              <span className="text-gray-600">Toggle selection</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Actions</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>F</span>
              <span className="text-gray-600">Toggle favorite</span>
            </div>
            <div className="flex justify-between">
              <span>Delete</span>
              <span className="text-gray-600">Delete selected</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Search</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Ctrl/Cmd + K</span>
              <span className="text-gray-600">Focus search</span>
            </div>
            <div className="flex justify-between">
              <span>Ctrl/Cmd + F</span>
              <span className="text-gray-600">Find in page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
