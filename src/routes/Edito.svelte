<script lang="ts">
	import type { trpc } from '$lib/trpc/client';
	import type { Unsubscribable } from '@trpc/server/observable';
	import type Quill from 'quill';
	import type QuillCursors from 'quill-cursors';
	import type {Cursor} from 'quill-cursors';
	import { onDestroy, onMount } from 'svelte';

	let { client, path }: { client: ReturnType<typeof trpc>; path: string } = $props();

	let editor: HTMLDivElement;
	let quill: Quill;
	let user = Math.random().toString(36).substring(7);

	const unsubscribe: Unsubscribable[] = [];

	onDestroy(() => {
		unsubscribe.forEach((un) => un.unsubscribe());
		unsubscribe.splice(0, unsubscribe.length); // clear the array
	});

	onMount(() => {
		import('quill')
			.then(async (Quill) => {
				const QuillCursors = (await import('quill-cursors'));
				return { Quill: Quill.default, QuillCursorsConstructor: QuillCursors.default , Cursor: QuillCursors.Cursor};
			})

			.then(({ Quill, QuillCursorsConstructor}) => {
				Quill.register('modules/cursors', QuillCursorsConstructor);
				quill = new Quill(editor, {
					placeholder: 'Start collaborating…',
					theme: 'snow',
					modules: {
						cursors: {
                            transformOnTextChange: true,
                        },
						//  toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline'], ['code-block']],
						toolbar: [],
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
					client.addMessage.mutate({ path, type: 'text-change', user, data: delta });
				});
				quill.on('selection-change', function (range, oldRange, source) {
					if (source !== 'user') {
						return;
					}
					client.addMessage.mutate({ path, type: 'selection-change', user, data: range });
				});
                let createdCursors :Record<string,Cursor>= {};
				const un = client.allMessages.subscribe(
					{ path, user },
					{
						onData(data) {
							if (data.type == 'text-change') {
								quill.updateContents(data.data);
							}
							if (data.type == 'selection-change') {
                                if(!createdCursors[data.user]){
                                    createdCursors[data.user] = cursors.createCursor(data.user, data.user, 'blue');
                                }
								cursors.moveCursor(data.user, data.data);
							}
						}
					}
				);
				unsubscribe.push(un);
				// Attach cursors plugin
			});
	});
</script>

<div bind:this={editor} />
