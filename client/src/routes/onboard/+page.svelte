<script lang="ts">
    import { Button } from 'm3-svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    
    async function selectGoogleCalendar() {
        goto('/calendar');
    }

    async function selectAllOtherCalendars() {
        goto('/calendar');
    }
</script>

<div class="flex flex-col items-center justify-center h-screen">

    <h1 class="text-2xl font-bold text-center text-primary mb-5">Please select your preferred calendar!</h1>
    <div class="flex flex-row gap-4 peak">
        <Button variant="tonal" square onclick={selectGoogleCalendar}>Google Calendar</Button>
        <Button variant="outlined" square onclick={selectAllOtherCalendars}>All Other Calendars</Button>
    </div>
</div>

<style>
    :global(.peak button) {
        height: 3rem !important;
    }
</style>