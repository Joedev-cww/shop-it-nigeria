-- Storage policies. Files live in a folder named after the uploader's user id.
create policy "Owner uploads product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owner reads product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owner deletes product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner uploads id docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owner or admin reads id docs" on storage.objects for select to authenticated
  using (bucket_id = 'id-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));