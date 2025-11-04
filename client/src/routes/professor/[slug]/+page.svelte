<script lang="ts">
  import { page } from '$app/stores';

  // Access the 'slug' parameter from the URL
  const slug = $page.params.slug;

  // fetch data from server

</script>

<h1>Blog Post: {slug}</h1>