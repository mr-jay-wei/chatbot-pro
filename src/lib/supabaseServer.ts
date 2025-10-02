import { createClient } from '@supabase/supabase-js';

// 注意：这里的 Client 是用于服务器端的，使用了拥有最高权限的 SERVICE_KEY
// 这个文件不应该在任何客户端组件中导入
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);