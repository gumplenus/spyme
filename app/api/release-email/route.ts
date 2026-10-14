import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId и type обязательны' },
        { status: 400 }
      );
    }

    if (type !== 'banned' && type !== 'deleted') {
      return NextResponse.json(
        { error: 'type должен быть "banned" или "deleted"' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const newEmail = `${type}-${userId}@spyme.deleted`;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
    });

    if (error) {
      console.error('Ошибка смены email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newEmail });
  } catch (err: any) {
    console.error('Ошибка API release-email:', err);
    return NextResponse.json({ error: err.message || 'Неизвестная ошибка' }, { status: 500 });
  }
}