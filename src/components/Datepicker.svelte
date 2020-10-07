<script lang="ts">
  import Month from "./Month.svelte";
  import NavBar from "./NavBar.svelte";
  import Popover from "./Popover.svelte";
  import { formatDate, internationalize } from "timeUtils";
  import { keyCodes, keyCodesArray } from "./lib/keyCodes";
  import { onMount, createEventDispatcher } from "svelte";
  import { getMonths } from "./lib/helpers";

  const dispatch = createEventDispatcher();
  const today = new Date();

  let popover;

  export let format: string | any = "#{Y}-#{m}-#{d}";
  export let start = new Date(1987, 9, 29);
  export let end = new Date(2020, 9, 29);
  export let selected: Date = today;
  export let dateChosen: boolean = false;
  export let trigger: any = null;
  export let selectableCallback: any = null;
  export let weekStart: number = 0;
  export let daysOfWeek: string[][] = [
    ["Söndag", "Sön"],
    ["Måndag", "Mån"],
    ["Tisdag", "Tis"],
    ["Onsdag", "Ons"],
    ["Torsdag", "Tor"],
    ["Fredag", "Fre"],
    ["Lördag", "Lör"],
  ];
  export let monthsOfYear: string[][] = [
    ["Januari", "Jan"],
    ["Februari", "Feb"],
    ["Mars", "Mar"],
    ["April", "Apr"],
    ["Maj", "Maj"],
    ["Juni", "Jun"],
    ["Juli", "Jul"],
    ["Augusti", "Aug"],
    ["September", "Sep"],
    ["Oktober", "Okt"],
    ["November", "Nov"],
    ["December", "Dec"],
  ];

  export let style = "";

  // theming variables:
  export let buttonBackgroundColor = "#fff";
  export let buttonBorderColor = "#eee";
  export let buttonTextColor = "#333";
  export let highlightColor = "#f7901e";
  export let dayBackgroundColor = "none";
  export let dayTextColor = "#4a4a4a";
  export let dayHighlightedBackgroundColor = "#efefef";
  export let dayHighlightedTextColor = "#4a4a4a";

  internationalize({ daysOfWeek, monthsOfYear });
  let sortedDaysOfWeek =
    weekStart === 0
      ? daysOfWeek
      : (() => {
          let dow = daysOfWeek.slice();
          dow.push(dow.shift());
          return dow;
        })();

  let highlighted = today;
  let shouldShakeDate = false;
  let shakeHighlightTimeout;
  let month = today.getMonth();
  let year = today.getFullYear();

  let isOpen = false;
  let isClosing = false;

  today.setHours(0, 0, 0, 0);

  function assignmentHandler(formatted) {
    if (!trigger) return;
    trigger.innerHTML = formatted;
  }

  $: months = getMonths(start, end, selectableCallback, weekStart);

  let monthIndex = 0;
  $: {
    monthIndex = 0;
    for (let i = 0; i < months.length; i += 1) {
      if (months[i].month === month && months[i].year === year) {
        monthIndex = i;
      }
    }
  }
  $: visibleMonth = months[monthIndex];

  $: visibleMonthId = year + month / 100;
  $: lastVisibleDate =
    visibleMonth.weeks[visibleMonth.weeks.length - 1].days[6].date;
  $: firstVisibleDate = visibleMonth.weeks[0].days[0].date;
  $: canIncrementMonth = monthIndex < months.length - 1;
  $: canDecrementMonth = monthIndex > 0;
  $: wrapperStyle = `
    --button-background-color: ${buttonBackgroundColor};
    --button-border-color: ${buttonBorderColor};
    --button-text-color: ${buttonTextColor};
    --highlight-color: ${highlightColor};
    --day-background-color: ${dayBackgroundColor};
    --day-text-color: ${dayTextColor};
    --day-highlighted-background-color: ${dayHighlightedBackgroundColor};
    --day-highlighted-text-color: ${dayHighlightedTextColor};
    ${style}
  `;

  export let formattedSelected;
  $: {
    formattedSelected =
      typeof format === "function"
        ? format(selected)
        : formatDate(selected, format);
  }

  onMount(() => {
    month = selected.getMonth();
    year = selected.getFullYear();
  });

  function changeMonth(e: CustomEvent) {
    const selectedMonth = e.detail;
    month = selectedMonth;
    highlighted = new Date(year, month, 1);
  }
  function isCustomEvent(e: any): e is CustomEvent {
    return (e as CustomEvent).detail !== undefined;
  }
  function incrementMonth(e: Event | CustomEvent | number, day = 1) {
    let direction;
    if (typeof e === "number") {
      direction = e;
    } else if (isCustomEvent(e)) {
      direction = e.detail;
    } else {
      throw new Error("invalid parameter in incrementMonth");
    }
    if (direction === 1 && !canIncrementMonth) return;
    if (direction === -1 && !canDecrementMonth) return;
    let current = new Date(year, month, 1);
    current.setMonth(current.getMonth() + direction);
    month = current.getMonth();
    year = current.getFullYear();
    highlighted = new Date(year, month, day);
  }

  function getDefaultHighlighted() {
    return new Date(selected);
  }

  const getDay = (m, d, y) => {
    let theMonth = months.find(
      (aMonth) => aMonth.month === m && aMonth.year === y
    );
    if (!theMonth) return null;
    // eslint-disable-next-line
    for (let i = 0; i < theMonth.weeks.length; ++i) {
      // eslint-disable-next-line
      for (let j = 0; j < theMonth.weeks[i].days.length; ++j) {
        let aDay = theMonth.weeks[i].days[j];
        if (aDay.month === m && aDay.day === d && aDay.year === y) return aDay;
      }
    }
    return null;
  };

  function incrementDayHighlighted(amount) {
    let proposedDate = new Date(highlighted);
    proposedDate.setDate(highlighted.getDate() + amount);
    let correspondingDayObj = getDay(
      proposedDate.getMonth(),
      proposedDate.getDate(),
      proposedDate.getFullYear()
    );
    if (!correspondingDayObj || !correspondingDayObj.isInRange) return;
    highlighted = proposedDate;
    if (amount > 0 && highlighted > lastVisibleDate) {
      incrementMonth(1, highlighted.getDate());
    }
    if (amount < 0 && highlighted < firstVisibleDate) {
      incrementMonth(-1, highlighted.getDate());
    }
  }

  function checkIfVisibleDateIsSelectable(date) {
    const proposedDay = getDay(
      date.getMonth(),
      date.getDate(),
      date.getFullYear()
    );
    return proposedDay && proposedDay.selectable;
  }

  function shakeDate(date) {
    clearTimeout(shakeHighlightTimeout);
    shouldShakeDate = date;
    shakeHighlightTimeout = setTimeout(() => {
      shouldShakeDate = false;
    }, 700);
  }

  function assignValueToTrigger(formatted) {
    assignmentHandler(formatted);
  }
  function isDate(d: any): d is Date {
    return (d as Date).getDate !== undefined;
  }
  function registerSelection(e: Event | CustomEvent | Date) {
    let chosen;
    if (isDate(e)) {
      chosen = e as Date;
    } else if (isCustomEvent(e)) {
      chosen = e.detail;
    } else {
      throw new Error("invalid parameter in incrementMonth");
    }
    if (!checkIfVisibleDateIsSelectable(chosen)) return shakeDate(chosen);
    // eslint-disable-next-line
    close();
    selected = chosen;
    dateChosen = true;
    assignValueToTrigger(formattedSelected);
    return dispatch("dateSelected", { date: chosen });
  }

  function handleKeyPress(evt) {
    if (keyCodesArray.indexOf(evt.keyCode) === -1) return;
    evt.preventDefault();
    switch (evt.keyCode) {
      case keyCodes.left:
        incrementDayHighlighted(-1);
        break;
      case keyCodes.up:
        incrementDayHighlighted(-7);
        break;
      case keyCodes.right:
        incrementDayHighlighted(1);
        break;
      case keyCodes.down:
        incrementDayHighlighted(7);
        break;
      case keyCodes.pgup:
        incrementMonth(-1);
        break;
      case keyCodes.pgdown:
        incrementMonth(1);
        break;
      case keyCodes.escape:
        // eslint-disable-next-line
        close();
        break;
      case keyCodes.enter:
        registerSelection(highlighted);
        break;
      default:
        break;
    }
  }

  function registerClose() {
    document.removeEventListener("keydown", handleKeyPress);
    dispatch("close");
  }

  function close() {
    popover.close();
    registerClose();
  }

  function registerOpen() {
    highlighted = getDefaultHighlighted();
    month = selected.getMonth();
    year = selected.getFullYear();
    document.addEventListener("keydown", handleKeyPress);
    dispatch("open");
  }
</script>

<style>
  .datepicker {
    display: inline-block;
    margin: 0 auto;
    padding: 0;
    text-align: center;
    overflow: visible;
  }

  .calendar-button {
    display: block;
    text-align: left;
    width: 100%;
    cursor: pointer;
    background: var(--button-background-color);
    border: lightgray solid thin;
    margin: 0;
    color: black;
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  .calendar {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    user-select: none;
    width: 100vw;
    padding: 10px;
    padding-top: 0;
  }

  @media (min-width: 480px) {
    .calendar {
      height: auto;
      width: 340px;
      max-width: 100%;
    }
  }

  .legend {
    color: #4a4a4a;
    padding: 10px 0;
    margin-bottom: 5px;
  }

  .legend span {
    width: 14.285714%;
    display: inline-block;
    text-align: center;
  }
</style>

<div
  class="datepicker"
  class:open={isOpen}
  class:closing={isClosing}
  style={wrapperStyle}>
  <Popover
    bind:this={popover}
    bind:open={isOpen}
    bind:shrink={isClosing}
    {trigger}
    on:opened={registerOpen}
    on:closed={registerClose}>
    <div slot="trigger">
      <slot {selected} {formattedSelected}>
        {#if !trigger}
          <button class="calendar-button" type="button">
            {formattedSelected}
          </button>
        {/if}
      </slot>
    </div>
    <div slot="contents">
      <div class="calendar">
        <NavBar
          {month}
          {year}
          {canIncrementMonth}
          {canDecrementMonth}
          {start}
          {end}
          {monthsOfYear}
          on:monthSelected={changeMonth}
          on:incrementMonth={incrementMonth} />
        <div class="legend">
          {#each sortedDaysOfWeek as day}<span>{day[1]}</span>{/each}
        </div>
        <Month
          {visibleMonth}
          {selected}
          {highlighted}
          {shouldShakeDate}
          id={visibleMonthId}
          on:dateSelected={registerSelection} />
      </div>
    </div>
  </Popover>
</div>
