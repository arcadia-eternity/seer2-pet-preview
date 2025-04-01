<svelte:options customElement={{ tag: "pet-render" }} />

<script>
  // @ts-nocheck
  import { onMount, onDestroy } from "svelte";
  import { createEventDispatcher } from "svelte";

  export let url = "";
  export let reverse = false;
  export let scale = "noscale";
  let player = null;
  const swfUrl = "petContainer.swf";
  const instanceId = Math.random().toString(36).substring(2, 15);
  let container = null;
  const dispatch = createEventDispatcher();
  let callbacksReady = false;
  let readyPromiseResolve;
  const readyPromise = new Promise((resolve) => {
    readyPromiseResolve = resolve;
  });

  const loadRuffle = async () => {
    while (!window.RufflePlayer) {
      await new Promise((res) => setTimeout(res, 100));
    }
  };

  if (!window.handleEventFromSWF) {
    window.handleEventFromSWF = (eventName, data) => {
      console.debug(`收到 SWF 事件: ${eventName}`, data);
      // 确保所有事件都包含instanceId
      const eventData = {
        ...data,
        instanceId: data?.instanceId || "",
      };

      // 只处理匹配当前实例ID的事件
      if (eventData.instanceId !== instanceId) {
        console.debug(
          `忽略不匹配实例的事件: ${eventName} (期望: ${instanceId}, 收到: ${eventData.instanceId})`
        );
        return;
      }

      switch (eventName) {
        case "animationComplete":
          dispatch("animationComplete", eventData);
          break;
        case "hit":
          dispatch("hit", eventData);
          break;
        default:
          console.warn(`未知事件: ${eventName}`);
      }
    };
  }

  const createPlayer = () => {
    if (!container || !swfUrl) return;

    const Ruffle = window.RufflePlayer?.newest();
    if (!Ruffle) {
      console.log("Ruffle doesnt exist");
      return;
    }

    player = Ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";
    player.style.transform = reverse ? "scaleX(-1)" : "none";
    container.appendChild(player);

    player
      .ruffle()
      .load({
        url: `${swfUrl}?url=${encodeURIComponent(url)}&instanceId=${instanceId}&scale=${scale}`,
        allowScriptAccess: true, // 需要允许脚本访问以支持ExternalInterface
        wmode: "transparent",
        autoplay: "on",
        unmuteOverlay: "hidden",
        upgradeToHttps: window.location.protocol === "https:",
        splashScreen: false,
        scale: scale,
      })
      .then(() => {
        handleSWFReady();
      });
  };

  const destroyPlayer = () => {
    if (player && container) {
      player.pause();
      container.removeChild(player);
      callbacksReady = false;
      player = null;
    }
  };

  // 处理SWF准备就绪事件
  function handleSWFReady() {
    console.log("swfready");
    readyPromiseResolve();
    dispatch("swfready");
  }

  // 等待完全就绪
  export async function whenReady() {
    await readyPromise;
    while (!callbacksReady) {
      await new Promise((r) => setTimeout(r, 16)); // 等待1帧
    }
  }

  onMount(async () => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle/ruffle.min.js";
    script.async = true;
    document.body.appendChild(script);
    await loadRuffle();
    createPlayer();

    // 监听回调就绪事件
    window.addEventListener("message", (e) => {
      if (e.data?.type === "petRenderCallbacksReady") {
        // 确保事件包含instanceId且匹配当前实例
        if (e.data.instanceId === instanceId) {
          callbacksReady = true;
        } else {
          console.debug(
            `忽略不匹配实例的回调就绪事件 (期望: ${instanceId}, 收到: ${e.data.instanceId})`
          );
        }
      }
    });
  });

  onDestroy(() => {
    destroyPlayer();
  });

  // 设置战斗状态
  export function setState(state) {
    if (!player) return;
    try {
      player.setState(state);
    } catch (e) {
      console.error("调用setState失败:", e);
    }
  }

  // 获取当前状态
  export function getState() {
    if (!player) return null;
    try {
      return player.getState();
    } catch (e) {
      console.error("调用getCurrentState失败:", e);
      return null;
    }
  }

  // 获取可用状态列表
  export function getAvailableStates() {
    if (!player) return [];
    try {
      return player.getAvailableStates();
    } catch (e) {
      console.error("调用getAvailableStates失败:", e);
      return [];
    }
  }

  // 播放控制方法
  export function play() {
    if (!player) createPlayer();
    player?.play();
  }

  export function pause() {
    player?.pause();
  }

  export function stop() {
    destroyPlayer();
  }

  // 监听url变化
  $: url && (stop(), createPlayer());

  // 监听reverse变化
  $: {
    if (player) {
      player.style.transform = reverse ? "scaleX(-1)" : "none";
      player.scale = scale;
    }
  }
</script>

<div bind:this={container} class="pet-container"></div>

<style>
  .pet-container {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }
</style>
