import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PublicSite } from "@/components/layout/public-site";
import { PRODUCT_NAME } from "@/config/product";

const items = [
  ["Оператор", "Владелец сервиса SimpleDesk. Перед запуском нужно указать юридическое лицо или ИП, адрес и email для обращений."],
  ["Субъект данных", "Пользователь, который регистрируется в SimpleDesk и использует рабочее пространство."],
  ["Данные", "Имя, email, сведения о компании, настройки аккаунта, а также данные, которые пользователь самостоятельно добавляет в сервис."],
  ["Цели", "Создание аккаунта, авторизация, предоставление доступа к кабинету, хранение рабочих данных, поддержка и развитие продукта."],
  ["Действия", "Сбор, запись, хранение, уточнение, использование, передача провайдерам инфраструктуры, обезличивание, блокирование и удаление."],
  ["Срок", "До удаления аккаунта, отзыва согласия или прекращения использования сервиса, если другой срок не требуется законом."],
  ["Отзыв", "Пользователь может отозвать согласие через обращение в поддержку. После отзыва часть функций сервиса может стать недоступной."]
];

export default function PersonalDataPage() {
  return (
    <PublicSite>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Юридическое</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
          Согласие на обработку персональных данных
        </h1>
        <p className="mt-4 text-muted-foreground">
          Нажимая галочку при регистрации, пользователь подтверждает, что
          ознакомился с условиями и разрешает обработку данных для работы {PRODUCT_NAME}.
        </p>

        <Card className="mt-8 p-6">
          <p className="text-sm text-muted-foreground">
            Это шаблон согласия для MVP. Для коммерческого запуска проверьте его
            под вашу юрисдикцию, реквизиты оператора и фактическую схему хранения данных.
          </p>
        </Card>

        <div className="mt-8 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map(([title, text]) => (
            <div key={title} className="grid gap-2 p-5 md:grid-cols-[180px_1fr]">
              <h2 className="font-semibold">{title}</h2>
              <p className="leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4 leading-7 text-muted-foreground">
          <p>
            Пользователь подтверждает, что действует свободно, своей волей и в
            своём интересе, а предоставленные данные являются актуальными.
          </p>
          <p>
            Если пользователь добавляет в сервис данные своих клиентов или
            сотрудников, он самостоятельно отвечает за наличие законного основания
            для такой обработки и информирование этих лиц.
          </p>
        </div>

        <div className="mt-10 text-sm text-muted-foreground">
          Связанные документы:{" "}
          <Link className="text-primary" href="/legal/terms">условия использования</Link>
          {" "}и{" "}
          <Link className="text-primary" href="/legal/privacy">политика конфиденциальности</Link>.
        </div>
      </section>
    </PublicSite>
  );
}
