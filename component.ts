import Component from '@glimmer/component';
type Args = {
    userId: string,
    userEmail: string
}
export default class MyComponent extends Component {
    args!: Args;
    name = 1;
    noob = 2;
    userName 
        = 3;
    names() {
        
    }
    item = {
        name: 'boo',
        age: 42
    }
}