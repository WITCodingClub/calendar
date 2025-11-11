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

<div class="bg-surface-container-lowest rounded-lg shadow-md p-6 max-w-4xl mx-auto border border-outline-variant">
    <div class="flex flex-row items-center gap-3 mb-3">
        <h2 class="text-xl font-bold text-primary">Advanced Editing</h2>
    </div>
    <p class="text-secondary text-center mb-4">
        Advanced editing allows you to customize your calendar events with more options. You can use variables to dynamically generate the title, description, and location of your calendar events.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Course Information</h3>
            <ul class="text-sm text-secondary space-y-1">
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;title&#125;&#125;</span> Full course title.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;course_code&#125;&#125;</span> Subject-number-section (e.g., COMP-101-01).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;subject&#125;&#125;</span> Department code (e.g., COMP).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;course_number&#125;&#125;</span> Course number only (e.g., 101).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;section_number&#125;&#125;</span> Section number (e.g., 01).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;crn&#125;&#125;</span> Course Reference Number.</li>
            </ul>
        </div>
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Location</h3>
            <ul class="text-sm text-secondary space-y-1">
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;room&#125;&#125;</span> Room number/name.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;building&#125;&#125;</span> Building name.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;location&#125;&#125;</span> Pre-formatted building - room.</li>
            </ul>
        </div>
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Faculty</h3>
            <ul class="text-sm text-secondary space-y-1">
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;faculty&#125;&#125;</span> Primary instructor.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;all_faculty&#125;&#125;</span> All instructors, comma-separated.</li>
            </ul>
        </div>
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Time</h3>
            <ul class="text-sm text-secondary space-y-1">
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;start_time&#125;&#125;</span> Meeting start time.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;end_time&#125;&#125;</span> Meeting end time.</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;day&#125;&#125;</span> Full weekday (e.g., Monday).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;day_abbr&#125;&#125;</span> Abbreviated weekday (e.g., Mon).</li>
            </ul>
        </div>
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Academic</h3>
            <ul class="text-sm text-secondary space-y-1">
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;term&#125;&#125;</span> Academic term (e.g., Spring 2024).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;schedule_type&#125;&#125;</span> Meeting type (Lecture, Laboratory, Hybrid).</li>
                <li><span class="px-1 rounded bg-primary/20 text-primary font-mono">&#123;&#123;schedule_type_short&#125;&#125;</span> Shorthand (e.g., Lab for Laboratory).</li>
            </ul>
        </div>
        <div class="flex flex-col rounded-md bg-primary/10 hover:bg-primary/20 transition p-4 gap-2 w-full">
            <h3 class="text-primary font-medium">Conditionals (if/else)</h3>
            <p class="text-sm text-secondary">Only simple <span class="font-mono">if</span>/<span class="font-mono">else</span> is supported.</p>
            <div class="text-xs text-tertiary bg-surface-container-highest rounded p-2 overflow-x-auto">
                <pre class="whitespace-pre-wrap"><code>&#123;&#123;title&#125;&#125;&#123;% if faculty %&#125; - &#123;&#123;faculty&#125;&#125;&#123;% else %&#125; - No instructor&#123;% endif %&#125;</code></pre>
            </div>
        </div>
    </div>
</div>