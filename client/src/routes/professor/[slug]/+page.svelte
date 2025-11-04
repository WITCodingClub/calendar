<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { RmpEndpointResponse } from '$lib/types/RmpEndpointResponse';
  import type { RmpRating } from '$lib/types/RmpRating';
  import { Button } from 'm3-svelte';
  import { slide } from 'svelte/transition';

  const rmpId = $page.params.slug;

  let professor = $state<RmpEndpointResponse | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);

  let expandedRatings = $state(new Set<string>());

  function toggleRating(id: string) {
    const newSet = new Set(expandedRatings);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    expandedRatings = newSet;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getDifficultyColor(difficulty: number): string {
    if (difficulty <= 2) return 'text-green-600';
    if (difficulty <= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  }

  async function fetchProfessorData() {
    try {
      loading = true;
      error = null;

      const response = await fetch(`https://heron-selected-literally.ngrok-free.app/api/professor/${rmpId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch professor data: ${response.statusText}`);
      }

      professor = await response.json();
    } catch (err) {
      console.error('Error loading professor data:', err);
      error = err instanceof Error ? err.message : 'Failed to load professor data';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchProfessorData();
  });
</script>

<div class="flex flex-col gap-4 p-3 w-full">
  {#if error}
    <div class="bg-error-container text-on-error-container p-3 rounded-lg">
      <h2 class="text-lg font-bold mb-1">Error</h2>
      <p class="text-sm">{error}</p>
    </div>
  {:else if loading}
    <div class="bg-surface-container-low p-3 rounded-lg text-center">
      <p class="text-sm text-on-surface-variant">Loading professor data...</p>
    </div>
  {:else if professor}
    <!-- Professor Header -->
    <div class="bg-surface-container-low rounded-lg p-4 shadow-md">
      <h1 class="text-xl font-bold mb-3">{professor.faculty_name}</h1>

      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col">
          <span class="text-xs text-on-surface-variant">Overall Rating</span>
          <span class="text-xl font-bold {getRatingColor(professor.avg_rating)}">
            {professor.avg_rating.toFixed(1)}
          </span>
          <span class="text-[10px] text-on-surface-variant">/ 5.0</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs text-on-surface-variant">Difficulty</span>
          <span class="text-xl font-bold {getDifficultyColor(professor.avg_difficulty)}">
            {professor.avg_difficulty.toFixed(1)}
          </span>
          <span class="text-[10px] text-on-surface-variant">/ 5.0</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs text-on-surface-variant">Would Take Again</span>
          <span class="text-xl font-bold {professor.would_take_again_percent >= 70 ? 'text-green-600' : professor.would_take_again_percent >= 50 ? 'text-yellow-600' : 'text-red-600'}">
            {professor.would_take_again_percent.toFixed(0)}%
          </span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs text-on-surface-variant">Total Ratings</span>
          <span class="text-xl font-bold">
            {professor.num_ratings}
          </span>
        </div>
      </div>
    </div>

    <!-- Individual Ratings -->
    <div class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">Student Ratings</h2>

      {#if professor.rmp_ratings && professor.rmp_ratings.length > 0}
        {#each professor.rmp_ratings as rating}
          <div class="bg-surface-container-low rounded-lg overflow-hidden shadow-sm">
            <!-- Rating Header -->
            <div class="flex flex-row justify-between items-start p-3 gap-3 bg-surface-container">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-1.5 items-center mb-2">
                  <span class="text-xs font-medium bg-primary-container text-on-primary-container px-2 py-0.5 rounded">
                    {rating.class}
                  </span>
                  {#if rating.grade}
                    <span class="text-xs bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">
                      Grade: {rating.grade}
                    </span>
                  {/if}
                  <span class="text-[10px] text-on-surface-variant">
                    {formatDate(rating.date)}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-1.5 text-xs">
                  <div>
                    <span class="text-on-surface-variant">Quality: </span>
                    <span class="font-semibold {getRatingColor(rating.clarityRating)}">{rating.clarityRating}</span>
                  </div>
                  <div>
                    <span class="text-on-surface-variant">Difficulty: </span>
                    <span class="font-semibold {getDifficultyColor(rating.difficultyRating)}">{rating.difficultyRating}</span>
                  </div>
                  <div>
                    <span class="text-on-surface-variant">Take Again: </span>
                    <span class="font-semibold">{rating.wouldTakeAgain === 1 ? 'Yes' : rating.wouldTakeAgain === 0 ? 'No' : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div class="shrink-0">
                <Button
                  variant="tonal"
                  square
                  onclick={() => toggleRating(rating.id)}
                >
                  <span style="display: inline-block; transition: transform 0.3s ease; transform: rotate({expandedRatings.has(rating.id) ? '180deg' : '0deg'})">
                    ↓
                  </span>
                </Button>
              </div>
            </div>

            <!-- Expanded Details -->
            {#if expandedRatings.has(rating.id)}
              <div transition:slide={{ duration: 300 }} class="px-3 pb-3 pt-2">
                <div class="flex flex-col gap-2 border-t border-outline-variant pt-2">
                  <!-- Comment -->
                  {#if rating.comment}
                    <div>
                      <span class="text-xs font-medium text-on-surface-variant">Comment:</span>
                      <p class="text-xs mt-1 leading-relaxed">{rating.comment}</p>
                    </div>
                  {/if}

                  <!-- Tags -->
                  {#if rating.ratingTags}
                    <div>
                      <span class="text-xs font-medium text-on-surface-variant">Tags:</span>
                      <div class="flex flex-wrap gap-1 mt-1">
                        {#each rating.ratingTags.split('--').filter(tag => tag.trim()) as tag}
                          <span class="text-[10px] bg-tertiary-container text-on-tertiary-container px-1.5 py-0.5 rounded">
                            {tag.trim()}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Additional Info -->
                  <div class="grid grid-cols-2 gap-1.5 text-xs">
                    {#if rating.attendanceMandatory}
                      <div>
                        <span class="text-on-surface-variant">Attendance: </span>
                        <span class="font-medium">{rating.attendanceMandatory}</span>
                      </div>
                    {/if}
                    <div>
                      <span class="text-on-surface-variant">Online: </span>
                      <span class="font-medium">{rating.isForOnlineClass ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span class="text-on-surface-variant">For Credit: </span>
                      <span class="font-medium">{rating.isForCredit ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span class="text-on-surface-variant">Helpful: </span>
                      <span class="font-medium">{rating.helpfulRating}/5</span>
                    </div>
                  </div>

                  <!-- Thumbs -->
                  {#if rating.thumbsUpTotal > 0 || rating.thumbsDownTotal > 0}
                    <div class="flex gap-3 text-xs">
                      <div class="flex items-center gap-1">
                        <span>👍</span>
                        <span class="text-on-surface-variant">{rating.thumbsUpTotal}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <span>👎</span>
                        <span class="text-on-surface-variant">{rating.thumbsDownTotal}</span>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {:else}
        <div class="bg-surface-container-low p-3 rounded-lg text-center">
          <p class="text-sm text-on-surface-variant">No ratings available for this professor.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>