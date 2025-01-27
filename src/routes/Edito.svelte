<script lang="ts">
	import type { trpc } from '$lib/trpc/client';
	import type { Unsubscribable } from '@trpc/server/observable';
	import type Quill from 'quill';
	import type QuillCursors from 'quill-cursors';
	import type { Cursor } from 'quill-cursors';
	import { onDestroy, onMount } from 'svelte';

	let {
		client,
		day: path,
		name,
		bounds
	}: {
		bounds?: HTMLElement;
		client: ReturnType<typeof trpc>;
		day: number;
		name: string;
	} = $props();

	let editor: HTMLDivElement;
	let quill: Quill;
	let user = $derived(name);

	const unsubscribe: Unsubscribable[] = [];

	onDestroy(() => {
		unsubscribe.forEach((un) => un.unsubscribe());
		unsubscribe.splice(0, unsubscribe.length); // clear the array
	});

	onMount(() => {
		import('quill')
			.then(async (Quill) => {
				const QuillCursors = await import('quill-cursors');
				return {
					Quill: Quill.default,
					QuillCursorsConstructor: QuillCursors.default,
					Cursor: QuillCursors.Cursor
				};
			})

			.then(({ Quill, QuillCursorsConstructor }) => {
				Quill.register('modules/cursors', QuillCursorsConstructor);

				quill = new Quill(editor, {
					placeholder: 'Start collaborating…',
					theme: 'bubble',
					bounds,
					modules: {
						// toolbar:false,
						cursors: {
							// transformOnTextChange: true,
							selectionChangeSource: 'cursor'
						},

						//   toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], ['code-block']],
						history: {
							// Local undo shouldn’t undo changes made by other users
							userOnly: true
						}
					}
				});

				const cursors = quill.getModule('cursors') as QuillCursors;
				
				quill.on('text-change', function (delta, oldDelta, source) {
					
					if (source !== 'user') {
						return;
					}
					client.addMessage.mutate({ day: path, type: 'text-change', user, data: delta });
				});
				quill.on('selection-change', function (range, oldRange, source) {
					
					if (source !== 'user' && source !== 'cursor') {
						return;
					}
					client.addMessage.mutate({ day: path, type: 'selection-change', user, data: range });
				});
				let createdCursors: Record<string, Cursor> = {};
				const un = client.allMessages.subscribe(
					{ day: path, user, name },
					{
						onData(data) {
							
							if (data.type == 'text-change') {
								quill.updateContents(data.data);
							} else if (data.type == 'selection-change') {
								cursors.moveCursor(data.user, data.data);
							} else if (data.type == 'init') {
								quill.setContents(data.data);
							} else if (data.type == 'user-add') {
								if (!createdCursors[data.data.id]) {
									
									createdCursors[data.data.id] = cursors.createCursor(
										data.data.id,
										data.data.name,
										data.data.color
									);
								}
							} else if (data.type == 'user-remove') {
								if (createdCursors[data.user]) {
									createdCursors[data.user].remove();
									delete createdCursors[data.user];
								}
							}
						}
					}
				);
				unsubscribe.push(un);
				// Attach cursors plugin
			});
	});
</script>

<div bind:this={editor} style="margin: 50px 0; overflow: visible;" />

<style>
	:global(.ql-editor) {
		overflow: visible;
	}
</style>
