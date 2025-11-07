<script lang="ts">
    import outlook from '$lib/images/outlook.svg';
    import apple from '$lib/images/apple.svg';
    import fantastical from '$lib/images/fantastical.jpg';
</script>

<div class="bg-surface-container-lowest rounded-lg shadow-md p-6 max-w-4xl mx-auto border border-outline-variant">
    <div class="flex flex-row items-center gap-3 mb-3">
        <h2 class="text-xl font-bold text-primary">Import ICS Calendar</h2>
    </div>
    <p class="text-secondary text-center mb-4">
        Easily add your calendar to your preferred calendar app by following the official instructions below.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        <a 
            href="https://support.microsoft.com/en-us/office/import-calendars-into-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379#:~:text=Add%20internet%20calendars"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full"
        >
            <img src={outlook} alt="Outlook Import" class="w-16 h-16 mb-2"/>
            <span class="text-primary font-medium">Outlook ICS Import Guide</span>
            <span class="text-sm text-tertiary">support.microsoft.com</span>
        </a>
        <a 
            href="https://support.apple.com/en-mn/guide/iphone/ipha0d932e96/ios#:~:text=Subscribe%20to%20iCal%20(.ics)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full"
        >
            <img src={apple} alt="Apple Import" class="w-16 h-16 mb-2"/>
            <span class="text-primary font-medium">Apple ICS Import Guide (iPhone)</span>
            <span class="text-sm text-tertiary">support.apple.com</span>
        </a>
        <a 
            href="https://support.apple.com/en-mn/guide/calendar/icl1022/mac#:~:text=share%20calendars.-,Subscribe%20to%20a%20calendar,-To%20subscribe%20to"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full"
        >
            <img src={apple} alt="Apple Import" class="w-16 h-16 mb-2"/>
            <span class="text-primary font-medium">Apple ICS Import Guide (Mac)</span>
            <span class="text-sm text-tertiary">support.apple.com</span>
        </a>
        <a 
            href="https://flexibits.com/fantastical/help/getting-started#adding-a-calendar-subscription"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full"
        >
            <img src={fantastical} alt="Fantastical Import" class="w-16 h-16 mb-2"/>
            <span class="text-primary font-medium">Fantastical ICS Import Guide</span>
            <span class="text-sm text-tertiary">flexibits.com</span>
        </a>
    </div>
</div>