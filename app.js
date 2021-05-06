// vueインスタンスを作成
// createAppメソッドの引数として各種オプションオブジェクトの設定(data,computed...etc)
Vue.createApp({
  data: function () {
    return {
      todoTitle: '',//todoTitleの状態管理
      todoDescription: '',//todoDescriptionの状態管理
      todoCategories: [],//カテゴリは全てここで管理
      selectedCategory: '',//選択済みのカテゴリの状態管理
      todos: [],//作成されたタスクがここに入る。watchで監視
      categories: [],//作成されたcategoriesがここに入る。watchで監視
      hideDoneTodo: false,//完了済みのタスクの表示・非表示を管理するための真偽値が格納される。初期値はfalseよってタスクは未完了の状態。
      searchWord: '',//searchWordの状態管理
      order: 'desc',//並び替えのためのワードをdescとascで管理。初期値はdescなので作成日時のタイムスタンプの降順(つまり新しいタスク順)に並ぶ仕様
      categoryName: '',//ユーザが入力したカテゴリがここに入る
    }
  },
  computed: {
    // todoTitleが空文字でないかを判定する
    canCreateTodo: function () {
      // タイトルは空文字でないか？空文字でなければtrue、空文字であればfalse
      // console.log(this.todoTitle !== '');
      return this.todoTitle !== ''
    },
    // カテゴリが作成できるかを判定
    canCreateCategory: function () {
      // this.categoryNameは空でない、かつ既存カテゴリに今から作成しようとしているカテゴリが存在しない
      return this.categoryName !== '' && !this.existsCategory
    },
    // 今入力したカテゴリがすでにローカルストレージに保存されているカテゴリに存在するか判定
    existsCategory: function () {
      // ユーザ入力カテゴリ名をcategoryNameに格納
      const categoryName = this.categoryName
      // カテゴリ一覧からユーザ入力のカテゴリが見つかるかを判定
      // 見つかったらtrueを返す、見つからないつまり既存カテゴリに存在しなければfalseを返す
      // console.log(this.categories.indexOf(categoryName) !== -1);
      return this.categories.indexOf(categoryName) !== -1;
    },
    // v-ifの表示判定で利用
    hasTodos: function () {
      // todosの要素数が0より大きければtrueをリターン、そうでなければfalseをリターン
      return this.todos.length > 0
    },
    // フィルタリングして必要なtodosのみ取り出す
    resultTodos: function () {
      // 画面で選択されているカテゴリを取得(初期値は指定なし)
      const selectedCategory = this.selectedCategory
      // hideDoneTodoがの真偽値を取得(初期値はfalse)
      const hideDoneTodo = this.hideDoneTodo
      // 並び替え順序指定(初期値はdesc、つまり降順、日付の新しいタスク順)
      const order = this.order
      // サーチワードの取得(初期値は空文字、トリム済み)
      const searchWord = this.searchWord
      // todosをフィルターしたり、並び変えたものをリターン。メソッドチェーン
      return this.todos
        //todos配列に対して、自身を引数としてフィルタリングを実施
        // フィルタ条件は選択済みカテゴリが空もしくは、
        // todo.categoriesの配列要素内にselectedCategoryが見つかった場合
        .filter(function (todo) {
          return (
            selectedCategory === '' ||
            todo.categories.indexOf(selectedCategory) !== -1
          )
        })
        .filter(function (todo) {
          // hideDoneTodoがtrueつまり、タスクが完了済みならtrue処理
          if (hideDoneTodo) {
            return !todo.done
          }
          // // hideDoneTodoがfalseつまり、タスクが未完了ならtrueをリターン
          return true
        })
        .filter(function (todo) {
          return (
            // todo.titleまたはdescriptionの中でsearchWordにかかった場合にリターン
            todo.title.indexOf(searchWord) !== -1 ||
            todo.description.indexOf(searchWord) !== -1
          )
        })
        // 昇順か降順の判定、デフォルトは降順
        // オブジェクトのdateTimeを比較
        .sort(function (a, b) {
          // もしorderがascなら
          if (order === 'asc') {
            // 昇順の処理
            // console.log('昇順の処理');
            // const diff = a.dateTime - b.dateTime
            return a.dateTime - b.dateTime
          }
          // 降順の処理(これが初期動作)
          // console.log('降順の処理');
          // const diff = b.dateTime - a.dateTime
          return b.dateTime - a.dateTime
        })
    },
    // 現在日時分と曜日を取得のための算出プロパティ
    dateFormatText: function () {
      const dowArr = ["日", "月", "火", "水", "木", "金", "土"];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      dow = dowArr[now.getDay()]; // 0は日曜日～6は土曜日
      const msg = `このAppを開いたのは${year}年${month}月${day}日${hours}時${minutes}分(${dow})です`;
      console.log(msg);
      return msg;
    },
  },
  watch: {
    // data:todosの変化を監視させて、変化があればhandlerの実行
    todos: {
      // nextには変化後のtodosが入っている。今回であればcreateTodo関数でtodosにタスクが追加された状態のtodosが入っている
      handler: function (next) {
        // ローカルストレージは文字列にしか対応していないので、todosを文字列して、キーをtodos バリューをtodosにして保存
        window.localStorage.setItem('todos', JSON.stringify(next))
      },
      // 配列の中のオブジェクトのように階層が深い場所で変更があった場合でも関数が実行できるようにtrueに設定
      deep: true,
    },
    categories: {
      handler: function (next) {
        window.localStorage.setItem('categories', JSON.stringify(next))
      },
      deep: true,
    },
  },
  methods: {
    // ここで作成した一件分のタスクデータを保存している
    createTodo: function () {
      // 算出プロパティのcanCreateTodoを参照、
      // returnがfalseつまり空文字なら反転させてtrueになりtodo作成処理は中止
      if (!this.canCreateTodo) {
        return
      }
      // 算出プロパティのcanCreateTodoを参照、
      // returnがtrueつまり何かしらのタイトルが入力されているなら反転させてfalseになるtodo作成処理の続行

      // todos配列の末尾にオブジェクトをプッシュ
      // プッシュしたさいにwatchオブジェクトでローカルストレージへの保存処理が実行
      this.todos.push({
        // idは一意にするためにタイムスタンプを付与
        id: 'todo-' + Date.now(),
        title: this.todoTitle,
        description: this.todoDescription,
        categories: this.todoCategories,
        dateTime: Date.now(),
        // タスクが作成された段階ではタスクは未達なのでfalse
        done: false,
      })
      // タスク作成が終了したら、初期化処理
      // タイトル・説明・選択されたカテゴリの削除
      this.todoTitle = ''
      this.todoDescription = ''
      this.todoCategories = []
    },
    createCategory: function () {

      // 算出プロパティのcanCreateCategoryがfalse、つまり空もしくは既存カテゴリに今から作るカテゴリが存在するなら
      // 真偽値を反転させてtrueになり処理の中止
      if (!this.canCreateCategory) {
        return
      }
      // 算出プロパティのcanCreateCategoryがtrueなら反転させてfalseになり処理続行
      // 既存カテゴリにプッシュメソッドでデータをの追加
      this.categories.push(this.categoryName)

      // 追加が終了したら現在入力されているカテゴリは空文字で消去する
      this.categoryName = ''
    },
    // 削除ボタンを押したさいのデリートメソッドの定義
    deleteItem: function (index) {
      // タスクの削除前確認
      let result = confirm('このタスクを削除しますか？');
      if (result) {
        console.log('削除しました');
      } else {
        return
      }
      // console.log('deleteItem');
      // this.todos配列の中からindexナンバの要素を削除
      this.todos.splice(index, 1);
    },
  },
  // ライフサイクルフックでvueインスタンスが作成された時の処理を定義(この時すでにdataオブジェクトにはアクセス可能)
  created: function () {
    // ローカルストレージのtodosのデータを変数に格納
    const todos = window.localStorage.getItem('todos')
    // 同じくcategoriesのデータも変数に格納
    const categories = window.localStorage.getItem('categories')

    // todosがtruthyな値、つまり何かしらデータがあれば処理実行
    if (todos) {
      // todosを文字列からJavaScriptの値やオブジェクトを構築、つまり良い感じにデータを戻してくれる
      // 戻したデータはthis.todosに保存
      this.todos = JSON.parse(todos)
    }

    // categoriesがtruthyな値、つまり何かしらデータがあれば処理実行
    if (categories) {
      // categoriesを文字列からJavaScriptの値やオブジェクトを構築、つまり良い感じにデータを戻してくれる
      // 戻したデータはthis.categoriesに保存
      this.categories = JSON.parse(categories)
    }
  },
  // #appにマウント(#app要素＋その子孫でvueの機能が使える)
}).mount('#app')
