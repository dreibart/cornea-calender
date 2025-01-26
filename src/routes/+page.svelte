<script lang="ts">
	import { CorneaDate } from '$lib';
	import { trpc } from '$lib/trpc/client';
	import '../default.scss';
	import Edito from './Edito.svelte';

	let day = $state(1);
	let numberOfDays = $state(10);
	let selectedDay: undefined | number = $state();

	const client = trpc();

	let data: Record<number, string> = $state({});

	let selectedDate = $derived(
		selectedDay != undefined ? CorneaDate.fromEpoch(selectedDay) : undefined
	);
	let now = $derived(CorneaDate.fromEpoch(day));

	async function updateData(day: number, text: string) {}
</script>

<Edito {client} path={'2'} />

<label>
	Current day
	<input type="number" bind:value={day} />
</label>

<label>
	Number of days
	<input type="number" bind:value={numberOfDays} />
</label>

<dialog open={selectedDay != undefined}>
	<article>
		<header>
			<button aria-label="Close" rel="prev" onclick={() => (selectedDay = undefined)}></button>
			<strong>{selectedDate}</strong>
		</header>
		<textarea> </textarea>
	</article>
</dialog>

<p>
	Sonnenjahr {now.sunYear}
</p>
<svg style="width: 100vw; height: 100vh;" viewBox="0 0 800 800">
	<!-- draw a circle with 150 segments -->

	{#each Array.from({ length: 600 }).map((_, i) => i) as i}
		{@const centerX = 400}
		{@const centerY = 400}

		{@const currnetDate = CorneaDate.from({ sunYear: now.sunYear, day: i })}

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

		<path
			class="dayfield"
			class:selected={currnetDate.daysSinceEpoch == now.daysSinceEpoch}
			d="M {x1} {y1} L {x2} {y2} L {x3} {y3} L {x4} {y4} Z"
			onclick={() => (selectedDay = currnetDate.daysSinceEpoch)}
			stroke-width="0.5"
		/>
		<!-- Text in the middel and tilt it acordenly -->
		<text
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
			{@const outerX2 = centerX + textRadius * Math.cos(semnetStartAngle + Math.PI / 2)}
			{@const outerY2 = centerY + textRadius * Math.sin(semnetStartAngle + Math.PI / 2)}

			<!-- <circle id="curve{i}" cx={centerX} cy={centerY} r={moonYearStart} fill="none" stroke="red" /> -->

			<path
				id="curve2{i}"
				d="M {outerX1} {outerY1} A {textRadius} {textRadius},  0, 0, 1, {outerX2} {outerY2}"
				stroke="transparent"
				fill="transparent"
			/>

			{@const lineX1 = centerX + outerRingEnd * Math.cos(semnetStartAngle)}
			{@const lineY1 = centerY + outerRingEnd * Math.sin(semnetStartAngle)}
			{@const lineX2 = centerX + moonYearStart * Math.cos(semnetStartAngle)}
			{@const lineY2 = centerY + moonYearStart * Math.sin(semnetStartAngle)}

			<path d="M {lineX1} {lineY1} L {lineX2} {lineY2}" />

			<!-- <path d="M {outerX1} {outerY1} L {outerX2} {outerY2}"  /> -->

			<text>
				<textPath
					xlink:href="#curve2{i}"
					startOffset="50%"
					text-anchor="middle"
					alignment-baseline="middle"
				>
					{currnetDate.monthName}
				</textPath>
			</text>
		{/if}

		<!-- moon yeras quarters-->
		{#if currnetDate.month == 1 && currnetDate.day == 1}
			{@const moonYearStart = dayStartRadius - 100}
			{@const moonYearEnd = moonYearStart + 60}
			{@const textRadius = (moonYearEnd - moonYearStart) / 2 + moonYearStart}

			{@const outerX1 = centerX + textRadius * Math.cos(semnetStartAngle)}
			{@const outerY1 = centerY + textRadius * Math.sin(semnetStartAngle)}
			{@const outerX2 = centerX + textRadius * Math.cos(semnetStartAngle + Math.PI / 2)}
			{@const outerY2 = centerY + textRadius * Math.sin(semnetStartAngle + Math.PI / 2)}

			{#if currnetDate.moonYear == 1}
				<circle cx={centerX} cy={centerY} r={moonYearStart} fill="none" stroke="red" />
				<circle cx={centerX} cy={centerY} r={moonYearEnd} fill="none" stroke="red" />
			{/if}

			<!-- <circle id="curve{i}" cx={centerX} cy={centerY} r={moonYearStart} fill="none" stroke="red" /> -->

			<path
				id="curve{i}"
				d="M {outerX1} {outerY1} A {textRadius} {textRadius},  0, 0, 1, {outerX2} {outerY2}"
				stroke="transparent"
				fill="transparent"
			/>

			<!-- <path d="M {outerX1} {outerY1} L {outerX2} {outerY2}"  /> -->

			<text>
				<textPath
					xlink:href="#curve{i}"
					startOffset="50%"
					text-anchor="middle"
					alignment-baseline="middle"
					font-size="36"
				>
					{currnetDate.moonYearName}
				</textPath>
			</text>
		{/if}

		{#if i == 599}
			<path
				d="M {centerX} {centerY + outerRingEnd} L {centerX} {centerY - outerRingEnd}"
				stroke-width="2"
			/>
			<path
				d="M {centerX + outerRingEnd} {centerY} L {centerX - outerRingEnd} {centerY}"
				stroke-width="2"
			/>
		{/if}
	{/each}
</svg>

<table>
	<thead>
		<tr>
			<th>Day</th>
			<th>Day of the week</th>
			<th>Month</th>
			<th>Moon year</th>
			<th>Sun year</th>
		</tr>
	</thead>
	<tbody>
		{#each Array.from( { length: numberOfDays } ).map((_, d) => d + day - Math.floor(numberOfDays / 2)) as d}
			{@const date = CorneaDate.fromEpoch(d)}
			<tr>
				<td>{date.day}</td>
				<td>{date.dayOfWeekName} ({date.dayOfWeek})</td>
				<td>{date.monthName} ({date.month})</td>
				<td>{date.moonYearName} ({date.moonYear})</td>
				<td>{date.sunYear}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style lang="scss">
	svg {
		stroke: var(--pico-color);
	}
	.dayfield {
		fill: transparent;
		cursor: pointer;
	}
	.dayfield:hover {
		fill: lightblue;
	}

	.dayfield.selected {
		fill: lightskyblue;
	}
	.dayfield.selected:hover {
		fill: lightsteelblue;
	}
</style>
