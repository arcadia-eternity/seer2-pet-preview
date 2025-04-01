<script lang="ts">
  import { onMount } from "svelte";
  import { ActionState } from "./FighterActionType";
  import 'seer2-pet-animator'

  let url = $state("fight/500.swf");
  let petRender: PetRenderElement;
  let status = $state("请选择SWF文件或输入URL");
  let urlInput = $state("fight/500.swf");
  let currentState = $state("");
  let animationMeta: any = null;
  let debugLogs: string[] = $state([]);
  let availableStates: string[] = $state([]);
  let reverse = $state(false);
  let showSidebar = $state(true);
  let showDebugLogs = $state(false);
  let isMobile = $state(false);
  let showAll = $state(false);

  const checkMobile = () => {
    isMobile = window.innerWidth < 768;
    showAll = isMobile;
  };

  const handleFileSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      url = URL.createObjectURL(file);
      status = `已加载: ${file.name}`;
    }
  };

  const handleAnimationComplete = (e: CustomEvent) => {
    addLog(`动画完成: ${JSON.stringify(e.detail)}`);
    console.log(e.detail);
  };

  const handleHit = (e: CustomEvent) => {
    addLog(`命中事件: ${JSON.stringify(e.detail)}`);
    console.log(e.detail);
  };

  const addLog = (message: string) => {
    debugLogs = [message, ...debugLogs].slice(0, 50);
  };

  const play = () => {
    petRender?.play();
    status = "播放中...";
    addLog("播放命令已发送");
  };

  const pause = () => {
    petRender?.pause();
    status = "已暂停";
    addLog("暂停命令已发送");
  };

  const stop = () => {
    petRender?.stop();
    status = "已停止";
    addLog("停止命令已发送");
  };

  const setState = (state: string) => {
    petRender?.setState(state);
    currentState = state;
    addLog(`设置状态: ${state}`);
  };

  const getState = () => {
    currentState = petRender?.getState() || "";
    addLog(`当前状态: ${currentState}`);
    return currentState;
  };

  const handleUrlSubmit = () => {
    url = urlInput;
    status = `已加载URL: ${urlInput}`;
  };

  onMount(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    petRender = document.querySelector('pet-render')! as PetRenderElement;
    petRender.addEventListener('ready', handleSWFReady);
    petRender.addEventListener('animationComplete', handleAnimationComplete);
    petRender.addEventListener('hit', handleHit);
    return () => {
      window.removeEventListener("resize", checkMobile);
      petRender?.removeEventListener('ready', handleSWFReady);
      petRender?.removeEventListener('animationComplete', handleAnimationComplete);
      petRender?.removeEventListener('hit', handleHit);
    };
  });

  const handleSWFReady = async () => {
    addLog("SWF准备就绪");
    getState();
    updateAvailableStates();
  };

  const updateAvailableStates = () => {
    availableStates = petRender?.getAvailableStates() || [];
    addLog(`可用状态: ${JSON.stringify(availableStates)}`);
  };
</script>

<main>
  <div class="toggle-buttons">
    <button onclick={() => (showSidebar = !showSidebar)}>
      {showSidebar ? "收起侧边栏" : "展开侧边栏"}
    </button>
    <button onclick={() => (showDebugLogs = !showDebugLogs)}>
      {showDebugLogs ? "隐藏调试日志" : "显示调试日志"}
    </button>
  </div>
  <div class="container" class:sidebar-collapsed={!showSidebar}>
    <div class="left-panel">
      <div class="controls">
        <div class="input-group">
          <input type="file" accept=".swf" onchange={handleFileSelect} />
          <div class="url-input">
            <input
              type="text"
              bind:value={urlInput}
              placeholder="输入SWF文件URL"
            />
            <button onclick={handleUrlSubmit}>加载URL</button>
          </div>
        </div>
        <div class="reverse-control">
          <label>
            <input type="checkbox" bind:checked={reverse} />
            水平翻转
          </label>
        </div>
        <div class="player-buttons">
          <button onclick={play} disabled={!url}>播放</button>
          <button onclick={pause} disabled={!url}>暂停</button>
          <button onclick={stop} disabled={!url}>停止</button>
        </div>
        <div class="state-buttons">
          {#each Object.values(ActionState) as state}
            <button
              onclick={() => setState(state)}
              disabled={!url || !availableStates.includes(state)}
            >
              {state}
            </button>
          {/each}
        </div>
        <button
          onclick={() => {
            getState();
            updateAvailableStates();
          }}
          disabled={!url}>获取当前状态</button
        >
      </div>

      <div class="status">{status}</div>
      <div class="debug-info">
        <h3>当前状态: {currentState}</h3>
        {#if animationMeta}
          <h3>动画元数据</h3>
          <pre>{JSON.stringify(animationMeta, null, 2)}</pre>
        {/if}
      </div>
    </div>

    <div class="right-panel">
      <div class="player-container">
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <pet-render
          url={url}
          reverse={reverse}
          scale={showAll ? "showAll" : "noscale"}
        />
      </div>
      <div class="debug-logs" class:hidden={!showDebugLogs}>
        <h3>调试日志</h3>
        {#each debugLogs as log}
          <div class="log-entry">{log}</div>
        {/each}
      </div>
    </div>
  </div>

  <div class="github-link">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      ></path>
    </svg>
    <a
      href="https://github.com/arcadia-star/seer2-pet-preview"
      target="_blank"
      rel="noopener noreferrer"
      style="color: white;"
    >
      项目源码
    </a>
  </div>
</main>

<style>
  :global(html) {
    font-size: 16px;
  }

  main {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .toggle-buttons {
    position: fixed;
    top: 0.5rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    gap: 0.5rem;
  }

  .container {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
    height: 100%;
    gap: 0;
  }

  .container.sidebar-collapsed .left-panel {
    display: none;
  }

  .left-panel {
    background: #f0f0f0;
    padding: 1rem;
    height: auto;
    overflow-y: auto;
  }

  .right-panel {
    position: relative;
    min-height: 50vh;
  }

  @media (min-width: 768px) {
    .container {
      grid-template-columns: 18rem 1fr;
    }

    .container.sidebar-collapsed {
      grid-template-columns: 0 1fr;
    }

    .left-panel {
      height: 100vh;
    }
  }

  .controls {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .url-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .url-input input {
    flex-grow: 1;
    padding: 0.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  .player-buttons,
  .state-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .state-buttons button {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
    flex-grow: 1;
    min-width: 5rem;
  }

  @media (min-width: 768px) {
    .url-input {
      flex-direction: row;
    }
  }

  .player-container {
    width: 100%;
    height: 100%;
    border: 1px solid #ccc;
    margin: 0 auto;
  }

  .status {
    margin: 1rem 0;
    font-style: italic;
    color: #000;
  }

  button {
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  .debug-info {
    margin: 1rem 0;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .debug-logs {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 30vh;
    overflow-y: auto;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px 4px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  @media (min-width: 768px) {
    .debug-logs {
      right: 1rem;
      top: 3rem;
      bottom: auto;
      left: auto;
      width: 25rem;
      max-height: 80vh;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  }

  .debug-logs.hidden {
    display: none;
  }

  .log-entry {
    padding: 0.5rem;
    border-bottom: 1px solid #ddd;
    font-family: monospace;
    font-size: 0.9rem;
    color: #000;
  }

  pre {
    white-space: pre-wrap;
    font-size: 0.8rem;
  }

  .github-link {
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
    z-index: 1000;
    background: #24292e;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .github-link:hover {
    background: #2d3339;
  }
</style>
