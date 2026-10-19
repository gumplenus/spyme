import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { field, value } = await req.json();

    if (!field || !value) {
      return NextResponse.json({ error: 'field и value обязательны' }, { status: 400 });
    }

    if (field !== 'email' && field !== 'username') {
      return NextResponse.json({ error: 'field должен быть "email" или "username"' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (field === 'email') {
      // Прямой запрос в auth.users через REST API с фильтром (без listUsers)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(value)}`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
        }
      );

      if (!res.ok) {
        return NextResponse.json({ error: 'Ошибка проверки email' }, { status: 500 });
      }

      const data = await res.json();
      const users = data.users || [];
      const exists = users.some(
        (u: any) => u.email?.toLowerCase() === value.toLowerCase()
      );

      return NextResponse.json({ exists });
    }

    // username
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id')
      .ilike('username', value)
      .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ exists: (data || []).length > 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ошибка' }, { status: 500 });
  }
}