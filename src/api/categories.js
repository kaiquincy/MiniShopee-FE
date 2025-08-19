import api from './client'
export async function getCategoryTree(){
  const { data } = await api.get('/api/categories/tree')
  return data?.result || []
}
