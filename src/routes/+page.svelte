<script lang="ts">
	import { browser } from '$app/environment';
	import { CorneaDate } from '$lib';
	import { trpc } from '$lib/trpc/client';
	import '../default.scss';
	import Edito from './Edito.svelte';
	import 'quill/dist/quill.bubble.css';
	import { onMount } from 'svelte';

	let day = $state(1);
	let month = $state(1);
	let moonYear = $state(1);
	let sunYear = $state(0);
	let now = $derived(CorneaDate.from({ day, month, moonYear, sunYear }));
	let epochDay = $derived(now.daysSinceEpoch);

	let afterMount = $state(false);

	$effect(() => {
		if (browser && afterMount) {
			client.dayChange.mutate(epochDay);
			// localStorage.setItem('day', epochDay.toString());
		}
	});

	function setDate(epochDay: number) {
		const date = CorneaDate.fromEpoch(epochDay);
		day = date.day;
		month = date.month;
		moonYear = date.moonYear;
		sunYear = date.sunYear;
	}

	let selectedDay: undefined | number = $state();
	let name: string = $state('');
	let changeName: string = $state('');
	let editDialog: HTMLElement | undefined = $state();

	const client = trpc();

	let daysWithData: number[] = $state([]);

	let selectedDate = $derived(
		selectedDay != undefined ? CorneaDate.fromEpoch(selectedDay) : undefined
	);

	onMount(() => {
		name = sessionStorage.getItem('name') ?? '';
		client.dayListener.subscribe(undefined,{
			onData(day) {
				afterMount = true;
				setDate(day);
			}
		})
		client.changeLisener.subscribe(undefined, {
			onData(input) {
				if (Array.isArray(input)) {
					input.forEach((day) => {
						daysWithData.push(day);
					});
				} else {
					if (input.hasData) {
						daysWithData.push(input.day);
					} else {
						daysWithData = daysWithData.filter((day) => day != input.day);
					}
				}
			}
		});
	});
</script>

<!-- {#if selectedDate != undefined} -->
<dialog open={selectedDay != undefined}>
	<article bind:this={editDialog}>
		<header>
			<button aria-label="Close" rel="prev" onclick={() => (selectedDay = undefined)}></button>
			<strong>{selectedDate}</strong><button
				class="text"
				role="link"
				disabled={epochDay == selectedDay}
				onclick={() => {
					setDate(selectedDay!);
				}}
				>{#if epochDay == selectedDay}
					Today
				{:else}
					As Now{/if}
			</button>
		</header>
		{#if selectedDay != undefined}
			<Edito {client} day={selectedDay} {name} bounds={editDialog} />
		{/if}
	</article>
</dialog>
<!-- {:else} -->
<h1>Cornea Kalender</h1>
<aside>
	<article style="padding-bottom: 0;">
		<!-- <header>
			Nutzer <strong>{name}</strong>
		</header> -->

		<div role="group">
			<input type="number" bind:value={day} min="1" max="30" />
			<select bind:value={month}>
				{#each CorneaDate.monthNames as m, i}
					<option value={i + 1}>{m}</option>
				{/each}
			</select>
			<!-- <input type="number" bind:value={month} min="1" max="5" /> -->
			<select bind:value={moonYear}>
				{#each CorneaDate.moonYearNames as m, i}
					<option value={i + 1}>{m}</option>
				{/each}
			</select>
			<!-- <input type="number" bind:value={moonYear} min="1" max="4" /> -->
			<input type="number" bind:value={sunYear} />
		</div>
	</article>
</aside>

<dialog open={name == ''}>
	<article>
		<header>
			<strong>Enter your name</strong>
		</header>
		<input type="text" bind:value={changeName} />
		<button
			onclick={() => {
				name = changeName?.trim();
				sessionStorage.setItem('name', name);
			}}>Save</button
		>
	</article>
</dialog>

<svg style="width: 100vw; height: 100vh; margin-top:1rem" viewBox="0 0 800 800">
	<!-- draw a circle with 150 segments -->

	{#each Array.from({ length: 600 }).map((_, i) => i) as i}
		{@const centerX = 400}
		{@const centerY = 400}

		{@const currnetDate = CorneaDate.from({ sunYear: now.sunYear, day: i + 1 })}

		{@const dayFiledHeight = 20}
		{@const dayStartRadius = 200}

		{@const outerRingStart = dayStartRadius + 5 * dayFiledHeight}
		{@const outerRingEnd = outerRingStart + 50}

		{@const segment = Math.floor(i / 30) % 20}
		{@const subSegment = i % 6}
		{@const ring = Math.floor(i / 6) % 5}

		{@const semnetStartAngle = (segment * 2 * Math.PI) / 20}
		{@const subSegmentStartAngle = (subSegment * 2 * Math.PI) / (20 * 6)}
		{@const subsegmentEndAngle = ((subSegment + 1) * 2 * Math.PI) / (20 * 6)}
		{@const ringStartRadius = dayStartRadius + ring * dayFiledHeight}
		{@const ringEndRadius = dayStartRadius + (ring + 1) * dayFiledHeight}

		{@const middleAngle =
			semnetStartAngle + subSegmentStartAngle + (subsegmentEndAngle - subSegmentStartAngle) / 2}
		{@const middleRadius = dayStartRadius + ring * dayFiledHeight + dayFiledHeight / 2}

		{@const x1 = centerX + ringStartRadius * Math.cos(semnetStartAngle + subSegmentStartAngle)}
		{@const y1 = centerY + ringStartRadius * Math.sin(semnetStartAngle + subSegmentStartAngle)}
		{@const x2 = centerX + ringEndRadius * Math.cos(semnetStartAngle + subSegmentStartAngle)}
		{@const y2 = centerY + ringEndRadius * Math.sin(semnetStartAngle + subSegmentStartAngle)}
		{@const x3 = centerX + ringEndRadius * Math.cos(semnetStartAngle + subsegmentEndAngle)}
		{@const y3 = centerY + ringEndRadius * Math.sin(semnetStartAngle + subsegmentEndAngle)}
		{@const x4 = centerX + ringStartRadius * Math.cos(semnetStartAngle + subsegmentEndAngle)}
		{@const y4 = centerY + ringStartRadius * Math.sin(semnetStartAngle + subsegmentEndAngle)}

		{@const moonYearStart = dayStartRadius - 100}
		{@const moonYearEnd = moonYearStart + 60}

		<g
			class="daybox"
			onclick={() => (selectedDay = currnetDate.daysSinceEpoch)}
			class:hasData={daysWithData.includes(currnetDate.daysSinceEpoch)}
		>
			<path
				class="dayfield"
				class:selected={currnetDate.daysSinceEpoch == now.daysSinceEpoch}
				d="M {x1} {y1} L {x2} {y2} L {x3} {y3} L {x4} {y4} Z"
				stroke-width="0.5"
			/>
			<!-- Text in the middel and tilt it acordenly -->
			<text
				class="daytext"
				font-size="5"
				text-anchor="middle"
				alignment-baseline="middle"
				x={centerX + middleRadius * Math.cos(middleAngle)}
				y={centerY + middleRadius * Math.sin(middleAngle)}
				transform="rotate({(middleAngle * 180) / Math.PI + 90} {centerX +
					middleRadius * Math.cos(middleAngle)} {centerY + middleRadius * Math.sin(middleAngle)})"
			>
				{currnetDate.day}
			</text>
		</g>

		{#if currnetDate.day <= 6}
			{@const textRadius = outerRingStart + 10}

			<!-- border of outer Text ring with weekdays  -->
			{@const outerX1 =
				centerX + outerRingStart * Math.cos(semnetStartAngle + subSegmentStartAngle)}
			{@const outerY1 =
				centerY + outerRingStart * Math.sin(semnetStartAngle + subSegmentStartAngle)}
			{@const outerX2 = centerX + outerRingEnd * Math.cos(semnetStartAngle + subSegmentStartAngle)}
			{@const outerY2 = centerY + outerRingEnd * Math.sin(semnetStartAngle + subSegmentStartAngle)}
			{@const outerX3 = centerX + outerRingEnd * Math.cos(semnetStartAngle + subsegmentEndAngle)}
			{@const outerY3 = centerY + outerRingEnd * Math.sin(semnetStartAngle + subsegmentEndAngle)}
			{@const outerX4 = centerX + outerRingStart * Math.cos(semnetStartAngle + subsegmentEndAngle)}
			{@const outerY4 = centerY + outerRingStart * Math.sin(semnetStartAngle + subsegmentEndAngle)}

			<path
				d="M {outerX1} {outerY1} L {outerX2} {outerY2} L {outerX3} {outerY3} L {outerX4} {outerY4} Z"
				fill="none"
			/>

			<text
				font-size="8"
				text-anchor="start"
				alignment-baseline="middle"
				class:selected={currnetDate.dayOfWeek == now.dayOfWeek &&
					currnetDate.month == now.month &&
					currnetDate.moonYear == now.moonYear}
				x={centerX + textRadius * Math.cos(middleAngle)}
				y={centerY + textRadius * Math.sin(middleAngle)}
				transform="rotate({(middleAngle * 180) / Math.PI} {centerX +
					textRadius * Math.cos(middleAngle)} {centerY + textRadius * Math.sin(middleAngle)})"
			>
				{currnetDate.dayOfWeekName}
			</text>
		{/if}

		{#if currnetDate.day == 1}
			{@const moonYearStart = dayStartRadius - 40}
			{@const moonYearEnd = dayStartRadius}
			{@const textRadius = (moonYearEnd - moonYearStart) / 2 + moonYearStart}

			{@const outerX1 = centerX + textRadius * Math.cos(semnetStartAngle)}
			{@const outerY1 = centerY + textRadius * Math.sin(semnetStartAngle)}
			{@const outerX2 = centerX + textRadius * Math.cos(semnetStartAngle + Math.PI / 10)}
			{@const outerY2 = centerY + textRadius * Math.sin(semnetStartAngle + Math.PI / 10)}

			<!-- <circle id="curve{i}" cx={centerX} cy={centerY} r={moonYearStart} fill="none" stroke="red" /> -->

			<path
				id="curve2{i}"
				d="M {outerX1} {outerY1} A {textRadius} {textRadius},  0, 0, 1, {outerX2} {outerY2}"
				class="none"
			/>

			{@const lineX1 = centerX + outerRingEnd * Math.cos(semnetStartAngle)}
			{@const lineY1 = centerY + outerRingEnd * Math.sin(semnetStartAngle)}
			{@const lineX2 = centerX + moonYearStart * Math.cos(semnetStartAngle)}
			{@const lineY2 = centerY + moonYearStart * Math.sin(semnetStartAngle)}

			<path d="M {lineX1} {lineY1} L {lineX2} {lineY2}" stroke-width="1" />

			<!-- <path d="M {outerX1} {outerY1} L {outerX2} {outerY2}"  /> -->

			<text>
				<textPath
					xlink:href="#curve2{i}"
					startOffset="50%"
					text-anchor="middle"
					alignment-baseline="middle"
					font-size="16"
					class:selected={currnetDate.month == now.month && currnetDate.moonYear == now.moonYear}
				>
					{currnetDate.monthName}
				</textPath>
			</text>
		{/if}

		<!-- moon yeras quarters-->
		{#if currnetDate.month == 1 && currnetDate.day == 1}
			{@const textRadius = (moonYearEnd - moonYearStart) / 2 + moonYearStart}

			{@const outerX1 = centerX + textRadius * Math.cos(semnetStartAngle)}
			{@const outerY1 = centerY + textRadius * Math.sin(semnetStartAngle)}
			{@const outerX2 = centerX + textRadius * Math.cos(semnetStartAngle + Math.PI / 2)}
			{@const outerY2 = centerY + textRadius * Math.sin(semnetStartAngle + Math.PI / 2)}

			{#if currnetDate.moonYear == 1}
				<circle
					cx={centerX}
					cy={centerY}
					r={moonYearStart}
					fill="none"
					stroke="var(--pico-color)"
				/>
				<circle cx={centerX} cy={centerY} r={moonYearEnd} fill="none" stroke="var(--pico-color)" />
			{/if}

			<!-- <circle id="curve{i}" cx={centerX} cy={centerY} r={moonYearStart} fill="none" stroke="red" /> -->

			<path
				id="curve{i}"
				d="M {outerX1} {outerY1} A {textRadius} {textRadius},  0, 0, 1, {outerX2} {outerY2}"
				class="none"
			/>

			<!-- <path d="M {outerX1} {outerY1} L {outerX2} {outerY2}"  /> -->

			<text>
				<textPath
					xlink:href="#curve{i}"
					startOffset="50%"
					text-anchor="middle"
					alignment-baseline="middle"
					font-size="36"
					class:selected={currnetDate.moonYear == now.moonYear}
				>
					{currnetDate.moonYearName}
				</textPath>
			</text>
		{/if}

		{#if i == 599}
			<path
				d="M {centerX} {centerY + outerRingEnd} L {centerX} {centerY + moonYearStart}"
				stroke-width="2"
			/>
			<path
				d="M {centerX} {centerY - outerRingEnd} L {centerX} {centerY - moonYearStart}"
				stroke-width="2"
			/>
			<path
				d="M {centerX + outerRingEnd} {centerY} L {centerX + moonYearStart} {centerY}"
				stroke-width="2"
			/>
			<path
				d="M {centerX - outerRingEnd} {centerY} L {centerX - moonYearStart} {centerY}"
				stroke-width="2"
			/>

			<text x={centerX} y={centerY} text-anchor="middle" alignment-baseline="middle" font-size="30">
				<tspan x={centerX} dy="-0.5em">Sonnen</tspan>
				<tspan x={centerX} dy="1em"> {currnetDate.sunYear}</tspan>
				<tspan x={centerX} dy="1em">Jahr</tspan>
			</text>
		{/if}
	{/each}
</svg>

<!-- {/if} -->
<style lang="scss">
	svg path {
		stroke: var(--pico-color);
		z-index: 1;
	}
	svg .none {
		stroke: none;
		fill: none;
	}

	.dayfield {
		fill: transparent;
	}
	.daytext {
		fill: var(--pico-color);
	}
	g.daybox {
		cursor: pointer;
	}
	g.daybox:hover > .dayfield {
		fill: var(--pico-secondary-hover-background);
	}

	.dayfield.selected {
		fill: var(--pico-primary-background);
	}
	g.daybox:hover >.dayfield.selected {
		fill: var(--pico-primary-hover-background);
	}
	.selected {
		stroke: var(--pico-primary);
	}
	textPath.selected,
	text.selected {
		stroke: none;
		fill: var(--pico-primary);
	}

	g.hasData {
		path {
			stroke-width: 2;
			stroke-dasharray: 3, 1;
			z-index: 100;
			stroke: var(--pico-ins-color);
		}
	}

	aside {
		position: fixed;
		top: 0;
		left: 0;
	}
	h1 {
		position: fixed;
		top: 0;
		right: 0;
		margin: var(--pico-spacing);
	}
</style>
