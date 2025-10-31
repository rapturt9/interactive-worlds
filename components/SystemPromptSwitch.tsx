export default function SystemPromptSwitch() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        <div className="mx-4 px-4 py-2 bg-purple-100 dark:bg-purple-900 border-2 border-purple-500 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="font-bold text-purple-900 dark:text-purple-100 text-sm uppercase tracking-wide">
              System Prompt Switched
            </span>
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300 text-center mt-1">
            World Generation → Gameplay Mode
          </div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
      </div>
    </div>
  );
}
