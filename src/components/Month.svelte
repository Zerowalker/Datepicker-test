<script lang="ts">
  import Week from "./Week.svelte";
  import type { IMonth } from "./lib/types";
  export let id: number;
  export let visibleMonth: IMonth;
  export let selected: Date;
  export let highlighted: Date;
  export let shouldShakeDate: boolean;

  let lastId = id;
  let direction;

  $: {
    direction = lastId < id ? 1 : -1;
    lastId = id;
  }
</script>

<style>
  .month-container {
    width: 100%;
    display: -ms-grid;
    display: grid;
    -ms-grid-columns: 1fr;
    -ms-grid-rows: 1fr;
  }
</style>

<div class="month-container">
  {#each visibleMonth.weeks as week (week.id)}
    <Week
      days={week.days}
      {selected}
      {highlighted}
      {shouldShakeDate}
      {direction}
      on:dateSelected />
  {/each}
</div>
