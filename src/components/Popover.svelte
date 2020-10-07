<script lang="ts">
  import { onMount, createEventDispatcher, tick } from "svelte";
  import { fade } from "svelte/transition";
  const dispatch = createEventDispatcher();

  let once = (el, evt, cb) => {
    function handler() {
      cb.apply(this, arguments);
      el.removeEventListener(evt, handler);
    }
    el.addEventListener(evt, handler);
  };

  let popover;
  let w;
  let triggerContainer;
  let contentsAnimated;
  let contentsWrapper;
  let translateY = 0;
  let translateX = 0;

  export let open = false;
  export let shrink: boolean;
  export let trigger: HTMLElement;
  export const close = () => {
    shrink = true;

    shrink = false;
    open = false;
    dispatch("closed");
  };

  function checkForFocusLoss(evt) {
    if (!open) return;
    let el = evt.target;
    // eslint-disable-next-line
    do {
      if (el === popover) return;
      // eslint-disable-next-line
    } while ((el = el.parentNode));
    close();
  }

  function triggerInit(node) {
    document.addEventListener("click", checkForFocusLoss);
    if (!trigger) return;
    node.appendChild(trigger.parentNode.removeChild(trigger));

    return {
      destroy() {
        document.removeEventListener("click", checkForFocusLoss);
      },
    };
  }

  const getDistanceToEdges = async () => {
    if (!open) {
      open = true;
    }
    await tick();
    let rect = contentsWrapper.getBoundingClientRect();
    return {
      top: rect.top + -1 * translateY,
      bottom: window.innerHeight - rect.bottom + translateY,
      left: rect.left + -1 * translateX,
      right: document.body.clientWidth - rect.right + translateX,
    };
  };

  const getTranslate = async () => {
    let dist = await getDistanceToEdges();
    let x;
    let y;
    if (w < 480) {
      y = dist.bottom;
    } else if (dist.top < 0) {
      y = Math.abs(dist.top);
    } else if (dist.bottom < 0) {
      y = dist.bottom;
    } else {
      y = 0;
    }
    if (dist.left < 0) {
      x = Math.abs(dist.left);
    } else if (dist.right < 0) {
      x = dist.right;
    } else {
      x = 0;
    }
    return { x, y };
  };

  const doOpen = async () => {
    const { x, y } = await getTranslate();

    translateX = x;
    translateY = y;
    open = true;

    dispatch("opened");
  };
</script>

<style>
  .sc-popover {
    position: relative;
  }

  .contents-wrapper {
    transform: translate(-50%, -50%);
    position: absolute;
    top: 50%;
    left: 50%;
    transition: none;
    z-index: 2;
  }

  .contents {
    background: #fff;
    box-shadow: 0px 10px 26px rgba(0, 0, 0, 0.4);
    padding-top: 0;
  }
</style>

<svelte:window bind:innerWidth={w} />
<div class="sc-popover" bind:this={popover}>
  <div class="trigger" on:click={doOpen} use:triggerInit>
    <slot name="trigger" />
  </div>
  {#if open}
    <div
      transition:fade={{ delay: 0, duration: 50 }}
      class="contents-wrapper"
      style="transform: translate(-50%,-50%) translate({translateX}px, {translateY}px)"
      bind:this={contentsWrapper}>
      <div class="contents" bind:this={contentsAnimated}>
        <div>
          <slot name="contents" />
        </div>
      </div>
    </div>
  {/if}
</div>
